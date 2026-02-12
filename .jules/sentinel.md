## 2024-05-23 - E2EE and Client-Side Rendering Risks
**Vulnerability:** XSS via `innerHTML` usage for decrypted messages.
**Learning:** End-to-End Encryption (E2EE) only protects data in transit. It does not sanitize data for display. Without careful rendering (e.g., using `textContent` instead of `innerHTML`), decrypted content can still execute malicious scripts.
**Prevention:** Always use `textContent` or strict sanitization when rendering user-generated content, even if it comes from a "secure" encrypted channel.
