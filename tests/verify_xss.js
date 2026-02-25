const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};
global.document = {
    getElementById: (id) => {
        if (id === 'chatBox') {
            return {
                appendChild: (el) => {
                    console.log("Appended element to chatBox.");
                    // Check the element's content
                    checkElementSafety(el);
                    return el;
                },
                scrollTop: 0,
                scrollHeight: 100
            };
        }
        return { value: '', focus: () => {} };
    },
    createElement: (tag) => {
        const el = { tagName: tag.toUpperCase(), children: [], _textContent: '', _innerHTML: '' };

        // Trap innerHTML usage
        Object.defineProperty(el, 'innerHTML', {
            set: (val) => {
                console.log(`[ALERT] Setting innerHTML to: ${val}`);
                el._innerHTML = val;
                // Basic check for HTML tags which indicate potential XSS if user input is involved
                if (val && (val.includes('<img') || val.includes('<script'))) {
                    console.error("FAIL: XSS payload detected in innerHTML!");
                    process.exit(1);
                }
            },
            get: () => el._innerHTML
        });

        // Mock textContent to verify safe usage
        Object.defineProperty(el, 'textContent', {
            set: (val) => {
                console.log(`[SAFE] Setting textContent to: ${val}`);
                el._textContent = val;
            },
            get: () => el._textContent
        });

        el.appendChild = (child) => {
            el.children.push(child);
            return child;
        };
        return el;
    },
    createTextNode: (text) => ({ nodeType: 3, textContent: text, children: [] })
};

function checkElementSafety(el) {
    const malicious = '<img src=x onerror=alert(1)>';

    // Recursive check
    function check(node) {
        if (node._innerHTML && node._innerHTML.includes(malicious)) {
            console.error("FAIL: Malicious payload found in innerHTML!");
            process.exit(1);
        }
        if (node.textContent === malicious || (node.nodeType === 3 && node.textContent === malicious)) {
             console.log("VERIFIED: Malicious payload found safely in textContent.");
             return true;
        }
        if (node.children) {
            for (const child of node.children) {
                if (check(child)) return true;
            }
        }
        return false;
    }

    if (check(el)) {
        console.log("SUCCESS: Payload rendered safely.");
    } else {
        // If we didn't find the payload safely, but also didn't find it in innerHTML (checked above),
        // it might mean it wasn't rendered at all or rendered differently.
        console.warn("WARNING: Payload not found in textContent. Check implementation.");
    }
}

global.prompt = () => 'test_user';
global.alert = () => {};
global.location = { reload: () => {} };
global.WebSocket = class {
    constructor() {
        this.onopen = () => {};
        this.onmessage = () => {};
        this.send = () => {};
    }
};
global.TextEncoder = class { encode() { return new Uint8Array(); } };
global.TextDecoder = class { decode() { return ''; } };
global.crypto = {
    subtle: {
        digest: async () => new ArrayBuffer(32),
        importKey: async () => {},
        encrypt: async () => new ArrayBuffer(10),
        decrypt: async () => new ArrayBuffer(10)
    },
    getRandomValues: (arr) => arr
};
global.Notification = { permission: 'default', requestPermission: () => {} };

// Read client script
const scriptPath = path.join(__dirname, '../client/script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Eval the script to load writeChatBox into global scope
try {
    eval(scriptContent);
} catch (e) {
    console.error("Error evaluating script:", e);
}

// Test case: verify writeChatBox handles malicious input safely
console.log("Testing writeChatBox with malicious input...");

const maliciousPayload = {
    type: 'message',
    user: 'attacker',
    text: '<img src=x onerror=alert(1)>' // This should be rendered as text, not HTML
};

try {
    if (typeof writeChatBox === 'function') {
        // Call writeChatBox with the new object structure
        writeChatBox(maliciousPayload);
    } else {
        console.error("writeChatBox function not found.");
        process.exit(1);
    }
} catch (e) {
    console.error("Error running writeChatBox test:", e);
    process.exit(1);
}
