## 2024-05-24 - Structured Messaging for XSS Prevention
**Vulnerability:** Decrypted messages were concatenated with HTML tags and inserted using `innerHTML`, allowing Stored XSS if a user injects a script.
**Learning:** Using `innerHTML` with user-provided content (even if encrypted during transmission) exposes the application to XSS. String concatenation for messages also makes it hard to distinguish between trusted formatting (e.g., username bolding) and user input.
**Prevention:** Always use structured data (JSON) for messaging to separate content from presentation. Render user content using `textContent` or `innerText` to prevent execution of injected scripts.
