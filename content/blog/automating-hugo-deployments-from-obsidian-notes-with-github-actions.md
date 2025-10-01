---
authors:
  - matt2ology
categories:
  - blog
date: 2025-09-24T00:01:22-07:00
draft: true
tags:
  - guide
title: Blog - Automating Hugo Deployments from Obsidian Notes with GitHub Actions
---

## End-to-End Guide: Obsidian → Hugo → GitHub Pages with 2 Repos

This guide walks through setting up a **two-repository workflow** where you use **Obsidian** to manage Markdown notes and automatically publish them to a **Hugo-based static site** deployed on GitHub Pages.

The flow looks like this:

1. Write notes in Obsidian.
2. Push them to `obsidian-note-vault-repo` (your notes repo).
3. GitHub Actions:

- Format Markdown files with Prettier.
- Sync changes into the content submodule of your Hugo repo (`username.github.io`) using SSH.
- Trigger a workflow in `username.github.io` via fine-grained PAT.

4. Hugo builds and deploys to GitHub Pages.

### Step 0: Repository Setup

You have two repositories:

1. **`obsidian-note-vault-repo`**: Stores your notes. This repo drives the pipeline and contains the content submodule.
2. **`username.github.io`**: Hugo site repository (deployed to GitHub Pages). The content folder points to `obsidian-note-vault-repo` as a Git submodule (cloned via SSH).
   - Has a **git submodule**: `content/` → points to `obsidian-note-vault-repo` via SSH

---

### Step 1: Add Submodule via SSH

From inside the Hugo repo (`username.github.io`):

```bash
git submodule add git@github.com:username/obsidian-note-vault-repo.git content
git commit -m "Add content submodule via SSH"
```

Your `.gitmodules` should look like:

```toml
[submodule "content"]
    path = content
    url = git@github.com:matt2ology/tech-journal-and-blog.git
```

### Step 2: Generate SSH Deploy Key

On your local machine generate a new SSH keypair without passphrase:

```bash
ssh-keygen -t ed25519 -C "github-actions@obsidian-to-hugo" -f ~/.ssh/obsidian-hugo
```

This creates two files:

- `obsidian-hugo`: private key (store in Actions secret; also, NEVER SHARE OR POST THIS WITH ANYONE ANYWHERE ELSE)
- `obsidian-hugo.pub`: public key (add to repo deploy keys)

#### Add keys

**Add a deploy key to your GitHub Pages repository**:

```bash
cat ~/.ssh/obsidian-hugo.pub
```

- Go to your repository `username.github.io` → **Settings** → **Deploy keys** → **Add deploy key**
- **Title**: `obsidian-to-hugo`
- **Key**: Paste the entire contents of your public key file (`~/.ssh/obsidian-hugo.pub`)
- Check **Allow write access**
- Click **Add key**

**Add a secret to your Obsidian notes repository**:

```bash
cat ~/.ssh/obsidian-hugo
```

- Go to your repository `obsidian-note-vault-repo` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- **Name:** `ACTIONS_DEPLOY_KEY`
- **Value:** Paste the contents of your private key file (`~/.ssh/obsidian-hugo`)
- Click **Add secret**

### Step 3: Adding Submodules

From your terminal:

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io

# Add the submodule and explicitly track the `main` branch
git submodule add -b main git@github.com:username/obsidian-note-vault-repo.git content

# Commit the submodule configuration
git add .gitmodules content
git commit -m "chore: Added obsidian-note-vault-repo as submodule (main branch only)"
git push origin main

# Add a theme I will be using https://github.com/CaiJimmy/hugo-theme-stack
git submodule add https://github.com/CaiJimmy/hugo-theme-stack/ themes/hugo-theme-stack

# Commit the theme submodule
git add .gitmodules themes/hugo-theme-stack
git commit -m "chore: Added Hugo Stack theme as submodule"
git push origin main

# Initialize and update all submodules (for future clones)
git submodule update --init --recursive

# Verify submodules are correctly set up
git submodule status
```

#### Switching from HTTPS to SSH

[git-submodule - Initialize, update or inspect submodules: `deinit [-f|--force] (--all|[--] <path>…​)`](https://git-scm.com/docs/git-submodule#Documentation/git-submodule.txt-deinit-f--force--all--path)

If you accidentally cloned the submodule using HTTPS, remove the existing HTTPS submodule and re-add it using SSH:

```bash
git submodule deinit -f content
rm -rf .git/modules/content
git rm -f content

git submodule add -b main git@github.com:username/obsidian-note-vault-repo.git content
git commit -m "Add content submodule via SSH"
git push
```

### Step 4. Create a Fine-grained PAT

Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**:

1. **Name**: `OBSIDIAN_NOTE_TO_HUGO_PAT`
2. **Owner**: your GitHub account
3. **Expiration:** set to a safe rotation policy
4. **Repos**: `obsidian-note-vault-repo`, `username.github.io`
5. **Permissions**:

- `Contents`: Read/Write
- `Metadata`: Read-only

6. Save token.
7. Add as a **secret** in both repos:
   - `Settings → Secrets and variables → Actions → New repository secret`
   - Name: `OBSIDIAN_NOTE_TO_HUGO_PAT`

Add this token as a secret named `OBSIDIAN_NOTE_TO_HUGO_PAT` in **both repos**.

---

### Step 5. Workflow in `obsidian-note-vault-repo`

File: `.github/workflows/format-and-trigger.yml`

```yml
name: Format Markdown with Prettier

on:
  workflow_dispatch: # manual trigger
  push:
    branches:
      - main # adjust branch if needed

permissions:
  contents: write # allow commits/push with GITHUB_TOKEN

jobs:
  format-and-trigger:
    runs-on: ubuntu-latest
    env:
      NODE_VERSION: 20
      TZ: America/Los_Angeles

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install Prettier
        run: npm install --global prettier

      - name: Run Prettier on Markdown
        run: prettier --write "**/*.md"

      - name: Verify installations
        run: |
          echo "Node.js: $(node --version)"
          echo "Prettier: $(prettier --version)"

      - name: Commit changes (if any)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          if git diff --cached --quiet; then
            echo "No changes to commit"
          else
            echo "Committing the formatted markdown files..."
            git commit -m "chore: format markdown with prettier"
            git push origin HEAD:main
            echo "Changes have been committed and pushed!"
          fi

      - name: Trigger Hugo site workflow
        run: |
          echo "Triggering Hugo site workflow in username.github.io..."
          curl -X POST \
            -H "Authorization: token ${{ secrets.OBSIDIAN_NOTE_TO_HUGO_PAT }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/username/username.github.io/dispatches \
            -d '{"event_type": "sync-from-notes", "client_payload": {"source_sha": "${{ github.sha }}"}}'
```

---

### Step 6. Workflow in `username.github.io`

File: `.github/workflows/deploy-hugo.yml`

```yml
name: Build and Deploy Hugo Site

on:
  workflow_dispatch: # Manual trigger
  repository_dispatch: # Triggered from another repo (e.g., notes)
    types: [sync-from-notes]

permissions:
  contents: write
  pages: write
  id-token: write

env:
  HUGO_CACHEDIR: /tmp/hugo_cache # Predictable path for Hugo module caching

jobs:
  build-hugo-site:
    runs-on: ubuntu-latest

    steps:
      # Checkout the site repo (including submodules)
      - name: Checkout site repo (with submodules)
        uses: actions/checkout@v5
        with:
          fetch-depth: 0
          submodules: recursive
          ssh-key: ${{ secrets.ACTIONS_DEPLOY_KEY }}

      # Pull latest changes from submodules (e.g., notes repo)
      - name: Update submodules
        run: |
          git submodule update --remote --merge
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add content
          if git diff --cached --quiet; then
            echo "✅ No submodule changes to commit"
          else
            echo "🔄 Submodule changes detected. Committing..."
            git commit -m "chore: sync content from notes repo"
            git push origin HEAD:main
            echo "🚀 Changes pushed to main branch"
          fi

      # Install Hugo
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: "latest"
          extended: true

      # Show installed Hugo version (debugging aid)
      - name: Show Hugo version
        run: hugo version

      # Cache Hugo Modules
      - name: Cache Hugo Modules
        uses: actions/cache@v4
        with:
          path: ${{ env.HUGO_CACHEDIR }}
          key: ${{ runner.os }}-hugomod-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-hugomod-

      # (Optional) Cache Hugo resources/ folder
      - name: Cache Hugo resources
        uses: actions/cache@v4
        with:
          path: resources
          key: ${{ runner.os }}-hugoresources-${{ github.ref }}
          restore-keys: |
            ${{ runner.os }}-hugoresources-

      # Build the Hugo site with production flags
      - name: Build Hugo site
        run: hugo --gc --minify

      # Upload the `public/` directory for deployment
      - name: Upload artifact for GitHub Pages
        uses: actions/upload-pages-artifact@v4
        with:
          path: ./public

  deploy:
    name: Deploy to GitHub Pages
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build-hugo-site

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Workflow Recap

1. You write notes in **Obsidian** → push to `obsidian-note-vault-repo`
2. Workflow formats with **Prettier**, commits if needed, and triggers Hugo site build
3. `username.github.io` workflow runs:
   - Updates `content` submodule
   - Builds Hugo site
   - Deploys to GitHub Pages

4. You can also manually run `deploy-hugo.yml` in `username.github.io` to force a rebuild

With this, we now have a **clean CI/CD pipeline**: Obsidian → Notes repo → Hugo → GitHub Pages, with manual override.

---

## Why Three Credentials?

Managing this pipeline requires three different credentials, each with its own purpose:

- **`GITHUB_TOKEN`** (auto-provided by GitHub)
  - Used for **commits inside `tech-journal-and-blog`** (your notes repo)
  - Only works within the same repository — **cannot** trigger workflows or access private repos across boundaries

- **`ACTIONS_DEPLOY_KEY`** (SSH private key, stored as a secret)
  - Used for **cloning and pushing the `content` submodule** (`matt2ology.github.io`) during CI
  - Public half of the key is added as a **Deploy Key** in `matt2ology.github.io`
  - Ensures reliable SSH-based submodule access without relying on HTTPS + PAT

- **`TECH_BLOG_TO_HUGO_PAT`** (fine-grained Personal Access Token)
  - Used for **cross-repo workflow triggers** (e.g. telling `matt2ology.github.io` to run its Hugo build after notes are synced)
  - Scoped to just the two repos with least privilege (`contents: read/write`, `metadata: read-only`)

---

### Credential Comparison

| Credential              | Scope of Use                                | Can Push Commits? | Can Trigger Workflows in Another Repo? | Best For                          |
| ----------------------- | ------------------------------------------- | ----------------- | -------------------------------------- | --------------------------------- |
| `GITHUB_TOKEN`          | Auto-provided per workflow, repo-local only | ✅ Yes            | ❌ No                                  | Internal CI/CD tasks in same repo |
| `ACTIONS_DEPLOY_KEY`    | SSH-based access to a single repository     | ✅ Yes            | ❌ No                                  | Submodules, Git read/write        |
| `TECH_BLOG_TO_HUGO_PAT` | Fine-grained access across multiple repos   | ✅ Yes            | ✅ Yes                                 | Cross-repo triggers & automation  |
