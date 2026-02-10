const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert');

test('XSS Vulnerability Fix Verification', async (t) => {
    const code = fs.readFileSync('client/script.js', 'utf8');

    const mockElements = {};
    let capturedSocket;

    const createMockElement = (tag) => ({
        tagName: tag,
        children: [],
        appendChild: function(child) {
            this.children.push(child);
            return child;
        },
        _textContent: '',
        get textContent() { return this._textContent; },
        set textContent(val) { this._textContent = val; }
    });

    const context = {
        prompt: (msg) => {
            if (msg.includes('IP')) return 'localhost';
            if (msg.includes('nome')) return 'User';
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
                    mockElements[id] = {
                        ...createMockElement('DIV'),
                        scrollTop: 0,
                        scrollHeight: 100,
                        value: '',
                        focus: () => {}
                    };
                }
                return mockElements[id];
            },
            createElement: createMockElement,
            createTextNode: (text) => ({ tagName: '#text', textContent: text }),
            hidden: false
        },
        WebSocket: class MockWebSocket {
            constructor(url) {
                this.url = url;
                this.readyState = 1; // OPEN
                capturedSocket = this;
            }
            send(data) { }
        },
        Notification: class MockNotification {
            constructor(title, options) {}
        },
        TextEncoder,
        TextDecoder,
        crypto: global.crypto,
        console: console,
        setTimeout: setTimeout
    };

    vm.createContext(context);
    vm.runInContext(code, context);

    // Wait for cryptoKey to finish
    await new Promise(resolve => setTimeout(resolve, 200));

    // Now trigger onopen if needed, but for this test we mainly care about onmessage
    // If we trigger onopen, it will try to encrypt "User entrou".
    // We should ensure key is ready.
    if (capturedSocket && capturedSocket.onopen) {
        await capturedSocket.onopen();
    }

    // Create a malicious payload
    const maliciousContent = '<img src=x onerror=alert(1)>';
    const payload = JSON.stringify({ u: 'Attacker', m: maliciousContent });

    // Encrypt payload
    // We can access 'encrypt' function from context
    // But we need to make sure keyEncrypted is set in context.
    // Since we waited, it should be set.
    // However, context.encrypt relies on context.keyEncrypted
    // which is a variable in the script scope, not a property of context object directly visible unless we exposed it?
    // Wait, vm.runInContext uses 'context' as the global object.
    // 'let keyEncrypted' at top level of script puts it on the context object?
    // No, 'let' and 'const' in top-level scope of a script do NOT become properties of the global object in V8/Node VM.
    // They are in a separate script scope.
    // So 'context.encrypt' might not work if 'encrypt' function is defined as 'async function encrypt...'.
    // Function declarations ARE hoisted to global object.
    // So 'context.encrypt' should be available.
    // But 'keyEncrypted' variable is 'let', so it's NOT on context.
    // But 'encrypt' function closes over it. So it should work.

    const encryptedPayload = await context.encrypt(payload);

    // Simulate receiving this message
    await capturedSocket.onmessage({ data: encryptedPayload.buffer });

    // Wait a bit for decrypt and render
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check chatBox
    const chatBox = mockElements['chatBox'];
    // There might be a "Bem-vindo" message first (from onopen logic or static text)
    // script.js onopen calls writeChatBox("Bem-vindo...")
    // Then sends "User entrou".

    // We want the LAST message.
    const lastMessage = chatBox.children[chatBox.children.length - 1];

    // If onopen ran, we might have multiple messages.
    // We should find the one with Attacker.

    // Let's iterate to find the attacker message
    let attackerMsg = null;
    for (const child of chatBox.children) {
        if (child.children && child.children.length > 0 && child.children[0].textContent === 'Attacker: ') {
            attackerMsg = child;
            break;
        }
    }

    assert.ok(attackerMsg, 'Attacker message not found');

    const textNode = attackerMsg.children[1];
    assert.strictEqual(textNode.tagName, '#text');
    assert.strictEqual(textNode.textContent, maliciousContent);

    console.log('Verified: Malicious content was treated as text node.');
});
