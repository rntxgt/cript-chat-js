## 2024-05-18 - DOM-based XSS in Chat Message Rendering
**Vulnerability:** A DOM-based Cross-Site Scripting (XSS) vulnerability exists in `client/script.js` due to the use of `innerHTML` to render decrypted chat messages directly into the DOM (`writeChatBox`). Malicious users can send crafted HTML payloads which will be executed in the browsers of all recipients.
**Learning:** This occurred because the application concatenated user input (name and message) directly into HTML strings (`"<b>" + nome + ": </b>" + ...`) and then assigned the resulting string to the `innerHTML` property of a newly created `p` element. The application assumed that since messages were encrypted in transit, they were inherently safe to render, forgetting that the source of the messages (other clients) is untrusted.
**Prevention:**
1. Never use `innerHTML` when rendering user-supplied data.
2. Use safe DOM manipulation methods like `createElement` and `textContent`.
3. Structure payloads using JSON (e.g., `{ type: 'message', user: 'name', text: 'msg' }`) to strictly separate data from presentation markup.
4. Cache DOM elements to improve performance and code readability, while safely assigning `textContent`.