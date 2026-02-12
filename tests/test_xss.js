const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '../client/script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Mock DOM
const mockDocument = {
  getElementById: (id) => {
    if (id === 'chatBox') {
      return {
        appendChild: (el) => {
          mockDocument.chatBox.children.push(el);
          return el;
        },
        scrollTop: 0,
        scrollHeight: 100,
        children: []
      };
    }
    return { value: 'some value', focus: () => {} };
  },
  createElement: (tag) => {
    const el = {
      tagName: tag,
      _innerHTML: '',
      _textContent: '',
      children: [],
      appendChild: function(child) {
        this.children.push(child);
        return child;
      },
      get innerHTML() { return this._innerHTML; },
      set innerHTML(val) { this._innerHTML = val; },
      get textContent() { return this._textContent; },
      set textContent(val) {
          this._textContent = val;
          // simulate safe text rendering
          this._innerHTML = val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
    };
    return el;
  },
  hidden: false
};
mockDocument.chatBox = mockDocument.getElementById('chatBox');

// Mock Window/Global
const mockWindow = {
  prompt: () => 'testuser',
  alert: () => {},
  location: { reload: () => {} },
  document: mockDocument,
  WebSocket: class {
    constructor() { this.binaryType = ''; }
    send() {}
  },
  Notification: { permission: 'denied', requestPermission: () => {} },
  crypto: {
    getRandomValues: () => new Uint8Array(12),
    subtle: {
      importKey: async () => ({}),
      digest: async () => new Uint8Array(32),
      encrypt: async () => {},
      decrypt: async () => {}
    }
  },
  TextEncoder: class { encode() { return new Uint8Array(); } },
  TextDecoder: class { decode() { return ''; } },
  console: console
};

const sandbox = {
  ...mockWindow,
  window: mockWindow
};

// Run the script
try {
    vm.createContext(sandbox);
    vm.runInContext(scriptContent, sandbox);
} catch (e) {
    console.error("Error running script in sandbox:", e);
    process.exit(1);
}

// Test malicious payload
console.log("Testing malicious payload...");
const maliciousPayload = '<img src=x onerror=alert(1)>';
sandbox.writeChatBox(maliciousPayload);

const lastChild = mockDocument.chatBox.children[mockDocument.chatBox.children.length - 1];
console.log('Resulting element innerHTML:', lastChild.innerHTML);

if (lastChild.innerHTML === maliciousPayload) {
  console.log('VULNERABILITY CONFIRMED: innerHTML was set directly with malicious payload.');
} else {
  console.log('SAFE: innerHTML does not contain the malicious payload directly.');
}

// Test structured payload
console.log("\nTesting structured payload...");
const structuredPayload = JSON.stringify({ type: 'chat', user: 'Alice', text: 'Hello' });
sandbox.writeChatBox(structuredPayload);
const structChild = mockDocument.chatBox.children[mockDocument.chatBox.children.length - 1];
// structChild should be <p> with <strong> and <span> children
console.log('Structured Result Children:', structChild.children.map(c => ({ tag: c.tagName, text: c.textContent })));

if (structChild.children.length === 2 && structChild.children[0].tagName === 'strong') {
    console.log("SUCCESS: Structured message rendered correctly.");
} else {
    console.log("FAILURE: Structured message not rendered correctly.");
}
