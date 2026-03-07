const localIp = prompt("Insira o IP do servidor: ");
const nome = prompt("Insira seu nome: ");
let key = prompt("Insira a chave: ");
let keyEncrypted;

// Cache DOM elements
const chatBoxElement = document.getElementById("chatBox");
const mensagemElement = document.getElementById("mensagem");

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
  writeChatBox("Bem-vindo ao Cript-Chat!", "system");
  socket.send(await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })));
};

socket.onmessage = async (message) => {
  try {
    const decryptedMsg = await decrypt(message.data);
    const msgData = JSON.parse(decryptedMsg);

    let displayMsg = "";
    if (msgData.type === "message") {
      displayMsg = `${msgData.user}: ${msgData.text}`;
      writeChatBox(msgData.text, msgData.user);
    } else if (msgData.type === "system") {
      displayMsg = msgData.text;
      writeChatBox(msgData.text, "system");
    }

    if (Notification.permission === "granted" && document.hidden) {
      new Notification("Nova mensagem no Cript-Chat", {
        body: displayMsg,
      }).onclick = function () {
        mensagemElement.focus();
        this.close();
      };
    }
  } catch (e) {
    console.error("Failed to parse message", e);
  }
};

socket.onclose = () =>
  writeChatBox(
    `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
    "system"
  );

async function sendMessage() {
  const msgValue = mensagemElement.value;
  if (msgValue == "" || msgValue.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    mensagemElement.focus();
  } else {
    socket.send(
      await encrypt(
        JSON.stringify({ type: "message", user: nome, text: msgValue })
      )
    );
    mensagemElement.value = "";
    mensagemElement.focus();
  }
}

function writeChatBox(messageChatBox, user) {
  const p = document.createElement("p");
  if (user === "system") {
      p.textContent = messageChatBox;
      p.style.fontStyle = "italic";
  } else if (user) {
      const b = document.createElement("b");
      b.textContent = user + ": ";
      p.appendChild(b);
      p.appendChild(document.createTextNode(messageChatBox));
  } else {
      p.textContent = messageChatBox;
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
