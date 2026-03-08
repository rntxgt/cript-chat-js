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
  writeChatBox({ type: "system", text: "Bem-vindo ao Cript-Chat!" });
  socket.send(await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })));
};

socket.onmessage = async (message) => {
  let msgString = await decrypt(message.data);
  let msgObj;
  try {
    msgObj = JSON.parse(msgString);
    if (!msgObj || typeof msgObj !== 'object') {
      msgObj = { type: "system", text: msgString };
    }
  } catch (e) {
    // Fallback for legacy messages or plain text
    msgObj = { type: "system", text: msgString };
  }

  writeChatBox(msgObj);

  if (Notification.permission === "granted" && document.hidden) {
    let notificationText = msgObj.type === "message" ? `${msgObj.user}: ${msgObj.text}` : msgObj.text;
    new Notification("Nova mensagem no Cript-Chat", {
      body: notificationText,
    }).onclick = function () {
      document.getElementById("mensagem").focus();
      this.close();
    };
  }
};

socket.onclose = () =>
  writeChatBox({
    type: "system",
    text: `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
  });

async function sendMessage() {
  const msgInput = document.getElementById("mensagem");
  if (
    msgInput.value == "" ||
    msgInput.value.length >= 500
  ) {
    alert("[ERRO] Digite uma mensagem válida!");
    msgInput.focus();
  } else {
    const payload = JSON.stringify({ type: "message", user: nome, text: msgInput.value });
    socket.send(await encrypt(payload));
    msgInput.value = "";
    msgInput.focus();
  }
}

function writeChatBox(msgObj) {
  const p = document.createElement("p");

  // Security fix: Use textContent instead of innerHTML to prevent XSS
  if (msgObj.type === "message") {
    const b = document.createElement("b");
    b.textContent = `${msgObj.user}: `;
    p.appendChild(b);
    p.appendChild(document.createTextNode(msgObj.text));
  } else {
    p.textContent = msgObj.text || "";
  }

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
