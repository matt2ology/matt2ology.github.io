const fancify = document.getElementById("idFancyShmancy");
const boring = document.getElementById("idBoringBetty");
fancify.addEventListener("change", fancifyOption);
boring.addEventListener("change", boringOption);

/**
 * This function should send an alert to the user.
 */
function sendAlert() {
  alert("Something Changed");
}

/**
 * This function should set the font size of the text area to 24pt.
 */
function makeTextBig() {
  document.getElementById("myTextArea").style.fontSize = "24px";
}

/**
 * When the user selects the "Fancy Shmancy" radio button.
 * It should set the text color to blue,
 * the font weight to "bold",
 * and the text decoration to "underline".
 */
function fancifyOption() {
  document.getElementById("myTextArea").style.color = "blue";
  document.getElementById("myTextArea").style.fontWeight = "bold";
  document.getElementById("myTextArea").style.textDecoration = "underline";
}

/**
 * When the user selects the "Boring Betty" radio button.
 * It should set the text color to black,
 * the font weight to "normal",
 * and the text decoration to "none".
 */
function boringOption() {
  document.getElementById("myTextArea").style.color = "black";
  document.getElementById("myTextArea").style.fontWeight = "normal";
  document.getElementById("myTextArea").style.textDecoration = "none";
}

/**
 * This function should convert the text in the text area to all caps.
 * It should also add "-Moo" to the last word of each sentence.
 *
 * @example
 *  "hello world. i am a cow." -> "HELLO WORLD. I AM A COW-Moo."
 *
 * @returns {void}
 */
function moo() {
  // get the text area element
  var textarea = document.getElementById("myTextArea");
  // get the text from the text area and convert it to uppercase (all caps)
  var text = textarea.value.toUpperCase();
  // split the text into sentences (split on . ! or ?)
  var sentences = text.split(/([.!?]+)/);

  // skip over punctuation tokens (i += 2)
  for (var i = 0; i < sentences.length; i += 2) {
    // get the sentence at index i (0, 2, 4, ...)
    var sentence = sentences[i];

    // if the sentence has a space in it (i.e. it has more than one word)
    if (/\s/.test(sentence)) {
      // split on whitespace (space, tab, newline, etc.) into words
      var words = sentence.split(/\s+/);
      // add "-Moo" to the last word of the sentence
      words[words.length - 1] += "-Moo";
      // rejoin the words into a sentence with spaces between them
      sentences[i] = words.join(" ");
    }
  }

  // rejoin the sentences into a single string with no spaces
  text = sentences.join("");
  // set the text area value to the new text string we created
  textarea.value = text;
}
