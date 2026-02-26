const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><div id="chatBox"></div>`);
const document = dom.window.document;

// Copy of appendUserMessage from client/script.js
function appendUserMessage(user, text) {
  const p = document.createElement("p");
  const b = document.createElement("b");
  b.textContent = user + ": ";
  p.appendChild(b);
  p.appendChild(document.createTextNode(text));
  document.getElementById("chatBox").appendChild(p);
  // Remove scrolling as it's not relevant for node test and might fail without styles
  // document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;
}

const maliciousUser = "Evil";
const maliciousMessage = "<img src=x onerror=alert('XSS')>";

appendUserMessage(maliciousUser, maliciousMessage);

const chatBox = document.getElementById("chatBox");
const injectedImg = chatBox.querySelector("img");
const p = chatBox.querySelector("p");

if (injectedImg) {
  console.error("VULNERABLE: Image tag injected!");
  process.exit(1);
} else {
  // Verify the text content is correct
  if (p.textContent.includes(maliciousMessage)) {
     console.log("SAFE: No image tag injected, and message text is present.");
  } else {
     console.error("ERROR: Message text not found?");
     process.exit(1);
  }
}
