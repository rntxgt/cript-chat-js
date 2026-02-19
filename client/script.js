const localIp = prompt("Insira o IP do servidor: ");
const nome = prompt("Insira seu nome: ");
let key = prompt("Insira a chave: ");
let keyEncrypted;

if (!nome || !key || !localIp) {
  alert("[ERRO] Nome, chave ou IP inválidos!");
  location.reload();
}

key += "2yCH5xqdCU7ja0dE";
cryptoKey();

if (window.Notification && Notification.permission === "default") {
  Notification.requestPermission();
}

socket = new WebSocket(`ws://${localIp}:8080`);
socket.binaryType = "arraybuffer";

socket.onopen = async () => {
  appendSystemMessage("Bem-vindo ao Cript-Chat!");
  // Send system message for user joining
  const msg = JSON.stringify({ type: "system", text: `${nome} entrou` });
  socket.send(await encrypt(msg));
};

socket.onmessage = async (message) => {
  try {
    const decrypted = await decrypt(message.data);
    const data = JSON.parse(decrypted);

    let notificationBody = "";

    if (data.type === "system") {
      appendSystemMessage(data.text);
      notificationBody = data.text;
    } else if (data.type === "message") {
      appendUserMessage(data.user, data.text);
      notificationBody = `${data.user}: ${data.text}`;
    }

    if (Notification.permission === "granted" && document.hidden && notificationBody) {
      new Notification("Nova mensagem no Cript-Chat", {
        body: notificationBody,
      }).onclick = function () {
        document.getElementById("mensagem").focus();
        this.close();
      };
    }
  } catch (e) {
    console.error("Failed to process message:", e);
  }
};

socket.onclose = () =>
  appendSystemMessage(
    `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
  );

async function sendMessage() {
  const input = document.getElementById("mensagem");
  const text = input.value;

  if (text === "" || text.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    input.focus();
  } else {
    // SECURITY: Use structured data instead of HTML strings to prevent XSS
    const msg = JSON.stringify({
      type: "message",
      user: nome,
      text: text
    });

    socket.send(await encrypt(msg));
    input.value = "";
    input.focus();
  }
}

// Helper to append system messages safely
function appendSystemMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  const chatBox = document.getElementById("chatBox");
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Helper to append user messages safely (prevents XSS)
function appendUserMessage(user, text) {
  const p = document.createElement("p");
  const b = document.createElement("b");
  b.textContent = user + ": ";
  p.appendChild(b);
  p.appendChild(document.createTextNode(text));
  const chatBox = document.getElementById("chatBox");
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// gera o hash e a chave
async function cryptoKey() {
  keyEncrypted = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

// criptografa a mensagem
async function encrypt(msg) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyEncrypted,
    new TextEncoder().encode(msg),
  );

  const packet = new Uint8Array(iv.length + encrypted.byteLength);
  packet.set(iv);
  packet.set(new Uint8Array(encrypted), iv.length);

  return packet;
}

// descriptografa a mensagem
async function decrypt(pack) {
  const buffer = new Uint8Array(pack);

  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: buffer.subarray(0, 12) },
      keyEncrypted,
      buffer.subarray(12),
    ),
  );
}
