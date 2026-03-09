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

const domMensagem = document.getElementById("mensagem");
const domChatBox = document.getElementById("chatBox");

socket.onopen = async () => {
  writeChatBox(JSON.stringify({ type: "system", text: "Bem-vindo ao Cript-Chat!" }));
  socket.send(await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })));
};

socket.onmessage = async (message) => {
  const decryptedMsg = await decrypt(message.data);
  let msgObj;
  try {
    msgObj = JSON.parse(decryptedMsg);
  } catch (e) {
    msgObj = { type: "system", text: decryptedMsg };
  }

  writeChatBox(decryptedMsg);

  if (Notification.permission === "granted" && document.hidden) {
    let notificationBody = msgObj.type === "message" ? `${msgObj.user}: ${msgObj.text}` : msgObj.text;
    new Notification("Nova mensagem no Cript-Chat", {
      body: notificationBody,
    }).onclick = function () {
      domMensagem.focus();
      this.close();
    };
  }
};

socket.onclose = () =>
  writeChatBox(
    JSON.stringify({ type: "system", text: `Conexão com o servidor perdida. Por favor, tente novamente mais tarde` })
  );

async function sendMessage() {
  const text = domMensagem.value;
  if (text === "" || text.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    domMensagem.focus();
  } else {
    socket.send(
      await encrypt(
        JSON.stringify({ type: "message", user: nome, text: text })
      ),
    );
    domMensagem.value = "";
    domMensagem.focus();
  }
}

function writeChatBox(messageString) {
  let msgObj;
  try {
    msgObj = JSON.parse(messageString);
  } catch (e) {
    msgObj = { type: "system", text: messageString };
  }

  const p = document.createElement("p");
  if (msgObj.type === "message") {
    const b = document.createElement("b");
    b.textContent = msgObj.user + ": ";
    p.appendChild(b);
    p.appendChild(document.createTextNode(msgObj.text));
  } else {
    p.textContent = msgObj.text;
  }

  domChatBox.appendChild(p);
  domChatBox.scrollTop = domChatBox.scrollHeight;
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
