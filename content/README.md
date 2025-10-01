# zettelkasten-obsidain-notes-to-hugo-template

Notes managed by Obsidian and transpiled to HTML via Hugo static site generator.

## Readwise Obsidian Export

### File name

```
rwd-{{author|lower|replace("and","")|replace(" ","-")|replace("...","")|truncate(20)}}-{{title|lower|replace(""","")|replace(""","")|replace("'","")|replace("'","")|replace("/","-")|replace(" ","-")|replace(" ","-")|replace("...","")|truncate(30)}}
```

### Page title

```
## {{ full_title }} (Highlights)
```

### Page metadata

```
{% if image_url -%}

![rw-book-cover]({{image_url}})

Source published date: {{published_date}}

{% endif -%}
{% if url -%}
**Link:** [{{full_title}}]({{url}})
{% else %}
source: {{source}}
{% endif -%}

```

### Highlights header

```
{% if is_new_page %}
## Highlights
{% elif has_new_highlights -%}
## New highlights added {{date|date('F j, Y')}} at {{time}}
{% endif -%}
```

### Highlight

```
{% if highlight_location == "View Highlight" %}### id{{ highlight_id }}{% elif highlight_location == "View Tweet" %}### id{{ highlight_id }}{% else %}### {{highlight_location}}{% endif %}

> {{ highlight_text }}{% if highlight_location and highlight_location_url %}
> \- [({{ highlight_location }})]({{ highlight_location_url }})
{% elif highlight_location %}
({{ highlight_location }})
{% else %}
<!-- Adding a blank line -->
{% endif %}{% if highlight_note %}
**Initial thought or note on:** {% if highlight_location and highlight_location_url %}[({{highlight_location}})]({{highlight_location_url}}){% elif highlight_location %}({{highlight_location}}){% endif %}
{{ highlight_note }}
{% endif %}
```

### YAML front matter

```
authors: {{author}}
categories:
  - reference
date: {{date|date("Y-m-d")}}
draft: true
media: {{category}}
source: {{source}}
tags: readwise, reference/{{category}}{% for tag in document_tags %}, {{tag}}{% endfor %}
title: Reference - {{author}} - {{title}}
```
