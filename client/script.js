const localIp = prompt("Insira o IP do servidor: ");
const nome = prompt("Insira seu nome: ");
let key = prompt("Insira a chave: ");
let keyEncrypted;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

cryptoKey();

if (!nome || !key || !localIp) {
  alert("[ERRO] Nome, chave ou IP inválidos!");
  location.reload();
}

key += "2yCH5xqdCU7ja0dE";

if (window.Notification && Notification.permission === "default") {
  Notification.requestPermission();
}

socket = new WebSocket(`ws://${localIp}:8080`);
socket.binaryType = "arraybuffer";

socket.onopen = async () => {
  writeChatBox("Bem-vindo ao Cript-Chat!");
  socket.send(await encrypt(JSON.stringify({ u: null, m: `${nome} entrou` })));
};

socket.onmessage = async (message) => {
  const decrypted = await decrypt(message.data);
  let data;
  try {
    data = JSON.parse(decrypted);
  } catch (e) {
    // Fallback for old clients or malformed data
    data = { u: null, m: decrypted };
  }

  const { u, m } = data;
  writeChatBox(m, u);

  if (Notification.permission === "granted" && document.hidden) {
    new Notification("Nova mensagem no Cript-Chat", {
      body: u ? `${u}: ${m}` : m,
    }).onclick = function () {
      document.getElementById("mensagem").focus();
      this.close();
    };
  }
};

socket.onclose = () =>
  writeChatBox(
    `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
  );

async function sendMessage() {
  const msgInput = document.getElementById("mensagem");
  const msgValue = msgInput.value;

  if (msgValue == "" || msgValue.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    msgInput.focus();
  } else {
    socket.send(await encrypt(JSON.stringify({ u: nome, m: msgValue })));
    msgInput.value = "";
    msgInput.focus();
  }
}

function writeChatBox(message, user = null) {
  const p = document.createElement("p");
  if (user) {
    const b = document.createElement("b");
    b.textContent = user + ": ";
    p.appendChild(b);
  }
  p.appendChild(document.createTextNode(message));

  const chatBox = document.getElementById("chatBox");
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// gera o hash e a chave
async function cryptoKey() {
  keyEncrypted = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", encoder.encode(key)),
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
    encoder.encode(msg),
  );

  const packet = new Uint8Array(iv.length + encrypted.byteLength);
  packet.set(iv);
  packet.set(new Uint8Array(encrypted), iv.length);

  return packet;
}

// descriptografa a mensagem
async function decrypt(pack) {
  const buffer = new Uint8Array(pack);

  return decoder.decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: buffer.subarray(0, 12) },
      keyEncrypted,
      buffer.subarray(12),
    ),
  );
}
