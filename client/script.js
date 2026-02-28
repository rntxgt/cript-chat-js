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

const chatBoxElement = document.getElementById("chatBox");
const mensagemElement = document.getElementById("mensagem");

socket = new WebSocket(`ws://${localIp}:8080`);
socket.binaryType = "arraybuffer";

socket.onopen = async () => {
  writeChatBox({ type: "system", text: "Bem-vindo ao Cript-Chat!" });
  socket.send(await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })));
};

socket.onmessage = async (message) => {
  let msgData;
  try {
    const decrypted = await decrypt(message.data);
    msgData = JSON.parse(decrypted);
  } catch (e) {
    return; // Ignore invalid or malformed messages
  }

  writeChatBox(msgData);

  if (Notification.permission === "granted" && document.hidden) {
    let notifyText = "";
    if (msgData.type === "message") {
      notifyText = `${msgData.user}: ${msgData.text}`;
    } else if (msgData.type === "system") {
      notifyText = msgData.text;
    }

    new Notification("Nova mensagem no Cript-Chat", {
      body: notifyText,
    }).onclick = function () {
      mensagemElement.focus();
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
  const msgValue = mensagemElement.value;
  if (msgValue == "" || msgValue.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    mensagemElement.focus();
  } else {
    socket.send(
      await encrypt(
        JSON.stringify({ type: "message", user: nome, text: msgValue })
      ),
    );
    mensagemElement.value = "";
    mensagemElement.focus();
  }
}

function writeChatBox(msgData) {
  const p = document.createElement("p");

  if (msgData.type === "message") {
    const b = document.createElement("b");
    b.textContent = `${msgData.user}: `;
    p.appendChild(b);
    p.appendChild(document.createTextNode(msgData.text));
  } else if (msgData.type === "system") {
    p.textContent = msgData.text;
  } else {
    return; // Unknown message type
  }

  chatBoxElement.appendChild(p);
  chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
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
