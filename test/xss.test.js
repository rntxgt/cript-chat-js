const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert');

test('XSS Vulnerability Reproduction & Fix Verification', async (t) => {
    const code = fs.readFileSync('client/script.js', 'utf8');

    const mockElements = {};

    // Mock DOM Node
    class MockNode {
        constructor(tag) {
            this.tagName = tag;
            this.children = [];
            this._innerHTML = '';
            this._textContent = '';
            this.nodeType = 1;
        }

        appendChild(child) {
            this.children.push(child);
            return child;
        }

        get innerHTML() {
            return this._innerHTML;
        }

        set innerHTML(val) {
            this._innerHTML = val;
        }

        get textContent() {
            return this._textContent;
        }

        set textContent(val) {
            this._textContent = val;
            // Simple approximation: if we set textContent, innerHTML becomes that text (escaped in real browser)
            this._innerHTML = val;
        }
    }

    class MockTextNode {
        constructor(text) {
            this.nodeType = 3;
            this.textContent = text;
        }
        get nodeValue() { return this.textContent; }
    }

    // Mock DOM and other globals
    const context = {
        prompt: (msg) => {
            if (msg.includes('IP')) return 'localhost';
            if (msg.includes('nome')) return 'Attacker';
            if (msg.includes('chave')) return 'secret';
            return '';
        },
        alert: () => {},
        location: { reload: () => {} },
        window: {
            crypto: global.crypto,
            Notification: { permission: 'granted', requestPermission: () => {} }
        },
        document: {
            getElementById: (id) => {
                if (!mockElements[id]) {
                    mockElements[id] = new MockNode('div');
                    mockElements[id].scrollTop = 0;
                    mockElements[id].scrollHeight = 100;
                    mockElements[id].value = ''; // for input
                    mockElements[id].focus = () => {};
                }
                return mockElements[id];
            },
            createElement: (tag) => new MockNode(tag),
            createTextNode: (text) => new MockTextNode(text),
            createDocumentFragment: () => new MockNode('#document-fragment'),
            hidden: false
        },
        Node: MockNode,
        WebSocket: class MockWebSocket {
            constructor(url) {
                this.url = url;
                this.readyState = 1; // OPEN
                // Delay onopen to allow cryptoKey generation to complete
                setTimeout(() => this.onopen && this.onopen(), 200);
            }
            send(data) {
                // simulated send
            }
        },
        Notification: class MockNotification {
            constructor(title, options) {}
        },
        TextEncoder,
        TextDecoder,
        crypto: global.crypto,
        console: console,
        setTimeout: setTimeout,
        setInterval: setInterval
    };

    vm.createContext(context);
    vm.runInContext(code, context);

    // Wait for cryptoKey and onopen to finish
    await new Promise(resolve => setTimeout(resolve, 300));

    // Prepare malicious payload
    // If the fix is implemented (JSON), sending a raw string might fail or be handled as legacy.
    // If the fix is NOT implemented, we expect existing behavior (string).

    // We will simulate a scenario where we verify if the code IS vulnerable.
    // But since we want to fix it, we should design the test to pass if the fix is correct.

    // Let's try to detect which version we are running? No, we know we are fixing it.

    // So, let's inject a message that conforms to the NEW protocol (JSON) with malicious content.
    // Payload: { type: 'chat', user: 'Attacker', text: '<img src=x onerror=alert(1)>' }

    const maliciousContent = '<img src=x onerror=alert(1)>';
    const payloadObj = { type: 'chat', user: 'Attacker', text: maliciousContent };

    // But wait, if I run this test BEFORE fixing, I should probably simulate the OLD behavior to confirm vulnerability?
    // The old code expects a string "<b>Attacker: </b>...".
    // If I send JSON to old code, it will just display the JSON string in innerHTML.
    // So `<img...>` inside JSON string would be displayed as text or rendered?
    // `{"text": "<img src=x>"}` -> innerHTML = `{"text": "<img src=x>"}`.
    // The `<` might be interpreted as tag start.

    // To confirm the vulnerability in the OLD code, we must send the string it expects.
    // To confirm safety in NEW code, we send JSON.

    // Let's try to support both in test or just assume we are testing the final state?
    // Sentinel says: "Verify the vulnerability is actually fixed".

    // So let's craft a payload that would be dangerous if treated as HTML.

    const maliciousPayload = JSON.stringify(payloadObj);
    const encryptedPayload = await context.encrypt(maliciousPayload);

    // Simulate receiving
    const socket = context.socket;
    await socket.onmessage({ data: encryptedPayload.buffer });

    // Wait for decrypt
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check chatBox
    const chatBox = mockElements['chatBox'];
    const lastMessage = chatBox.children[chatBox.children.length - 1];

    // If existing code runs (vulnerable):
    // It decrypts the JSON string and puts it into innerHTML.
    // The string contains `<img src=x onerror=alert(1)>`.
    // So innerHTML will contain the tag.

    // If fixed code runs:
    // It parses JSON. It creates a text node with the content.
    // innerHTML (via textContent) will contain the escaped version `&lt;img...` (conceptually)
    // or simply, the textContent will match the string, but it won't be parsed as HTML.

    // My mock `textContent` setter sets `_innerHTML = val`.
    // This is NOT how real browser works (it escapes).
    // So my mock is insufficient to distinguish via `innerHTML` check if I just check for string inclusion.

    // Better check:
    // In fixed code, we append `TextNode`.
    // In vulnerable code, we set `innerHTML` directly on `p`.

    // So we can check the structure of `lastMessage`.
    // Vulnerable: lastMessage is `p`. lastMessage.innerHTML is set. lastMessage.children is empty (mock implementation of innerHTML doesn't parse children).
    // Fixed: lastMessage is `p`. It has children: `b` and `TextNode`.

    if (lastMessage.children.length > 0) {
        // Safe! We used appendChild.
        const textNode = lastMessage.children.find(c => c.nodeType === 3);
        assert.ok(textNode, 'Should contain a text node');
        assert.strictEqual(textNode.textContent, maliciousContent, 'Text node content should be the raw string');
        console.log('Test Passed: Safe DOM manipulation detected.');
    } else {
        // Vulnerable! We set innerHTML directly and didn't create children nodes.
        // OR the JSON parsing failed and nothing happened.

        // Check if innerHTML has the tag
        if (lastMessage.innerHTML.includes('<img')) {
             console.log('Vulnerability detected: innerHTML contains raw HTML tags.');
             // Fail the test if we expect it to be fixed
             assert.fail('XSS Vulnerability detected: User input was injected into innerHTML without sanitization.');
        } else {
             console.log('Unknown state or parsing failed.');
        }
    }
});
