## 2026-03-06 - XSS via Direct innerHTML Render of Websocket Messages
**Vulnerability:** The client directly passed strings from the WebSocket into `document.createElement("p").innerHTML`, allowing anyone sending messages like `<img src=x onerror=alert(1)>` to execute arbitrary JavaScript on other users' browsers.
**Learning:** Decrypting content securely (AES-GCM) doesn't guarantee the data is safe to render in the UI. A secure channel still requires output encoding.
**Prevention:** Avoid `innerHTML` for displaying user input. Always structure data in transits (e.g. JSON strings over WebSocket) and safely insert content into the DOM using `textContent` and `document.createElement` to ensure all user inputs are treated as data, not code.
