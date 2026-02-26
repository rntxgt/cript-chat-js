## 2025-02-19 - Stored XSS via Unsafe DOM Manipulation in Chat
**Vulnerability:** A Stored Cross-Site Scripting (XSS) vulnerability was identified in `client/script.js`. The `writeChatBox` function used `innerHTML` to append encrypted messages to the chat window. Since the encryption is client-side and the server relays messages blindly, a malicious client could send an encrypted message containing HTML tags (e.g., `<img src=x onerror=alert(1)>`), which would be decrypted and executed in other clients' browsers.

**Learning:** Mixing presentation (HTML tags like `<b>`) with data (user name, message content) in a single string makes it difficult to sanitize safely on the receiving end. The original implementation relied on the sender to format the message, which implicitly trusted the sender to provide safe HTML.

**Prevention:**
1. **Separate Data from Presentation:** Migrated the communication protocol from raw strings to structured JSON (`{ type, user, text }`).
2. **Use Safe DOM Methods:** Replaced `innerHTML` with `textContent` and `createElement` (`appendUserMessage`, `appendLog`). This ensures that all user input is treated as text, neutralizing any HTML tags.
3. **Defense in Depth:** The receiver now parses the message structure and builds the DOM elements locally, rather than rendering a pre-formatted HTML string from an untrusted source.
