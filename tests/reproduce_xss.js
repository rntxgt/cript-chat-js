const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><div id="chatBox"></div>`);
const document = dom.window.document;

function writeChatBox(messageChatBox) {
  document
    .getElementById("chatBox")
    .appendChild(document.createElement("p")).innerHTML = messageChatBox;
}

const maliciousMessage = "<b>Evil: </b><img src=x onerror=alert('XSS')>";
writeChatBox(maliciousMessage);

const chatBox = document.getElementById("chatBox");
const injectedImg = chatBox.querySelector("img");

if (injectedImg) {
  console.log("VULNERABLE: Image tag injected!");
} else {
  console.log("SAFE: No image tag injected.");
  process.exit(1); // Fail if it's supposed to reproduce
}
