## 2026-05-18 - Client-Side Rendering Vulnerability in E2EE
**Vulnerability:** Stored XSS in `client/script.js` due to using `innerHTML` to render decrypted messages.
**Learning:** End-to-End Encryption (E2EE) protects data in transit but does not protect the client from rendering malicious content if the client-side code is insecure. The developer likely assumed that since the server couldn't see the messages, they were safe, but a malicious client could still send harmful payloads to other clients.
**Prevention:** Always use `textContent` or safe DOM manipulation methods for user-generated content, regardless of encryption. Validate and sanitize input on the client side before rendering.
