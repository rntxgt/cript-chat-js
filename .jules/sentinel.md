## 2026-02-12 - End-to-End Encryption Requires Client-Side Sanitization
**Vulnerability:** Stored XSS in decrypted messages.
**Learning:** In E2EE applications where the server cannot see the content, traditional server-side sanitization is impossible. The client is the sole line of defense against malicious content from other users.
**Prevention:** Always sanitize or escape decrypted content before rendering it in the DOM, even if it comes from authenticated peers. Use structured data (JSON) instead of raw HTML for messages.
