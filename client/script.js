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
  socket.send(
    await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })),
  );
};

socket.onmessage = async (message) => {
  const decrypted = await decrypt(message.data);
  let msgText = decrypted;

  try {
    const data = JSON.parse(decrypted);
    if (data.type === "message") {
      appendMessage(data.user, data.text);
      msgText = `${data.user}: ${data.text}`;
    } else if (data.type === "system") {
      appendSystemMessage(data.text);
      msgText = data.text;
    } else {
      appendSystemMessage(decrypted);
    }
  } catch (e) {
    appendSystemMessage(decrypted);
  }

  if (Notification.permission === "granted" && document.hidden) {
    new Notification("Nova mensagem no Cript-Chat", {
      body: msgText,
    }).onclick = function () {
      document.getElementById("mensagem").focus();
      this.close();
    };
  }
};

socket.onclose = () =>
  appendSystemMessage(
    `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
  );

async function sendMessage() {
  const msgInput = document.getElementById("mensagem");
  if (msgInput.value == "" || msgInput.value.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    msgInput.focus();
  } else {
    const message = {
      type: "message",
      user: nome,
      text: msgInput.value,
    };
    socket.send(await encrypt(JSON.stringify(message)));
    msgInput.value = "";
    msgInput.focus();
  }
}

function appendMessage(user, text) {
  const p = document.createElement("p");
  const b = document.createElement("b");
  b.textContent = user + ": ";
  p.appendChild(b);
  p.appendChild(document.createTextNode(text));
  document.getElementById("chatBox").appendChild(p);
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
}

function appendSystemMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  document.getElementById("chatBox").appendChild(p);
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
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
