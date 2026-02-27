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
  // Send system message as object
  socket.send(await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })));
};

socket.onmessage = async (message) => {
  try {
    const decryptedData = await decrypt(message.data);
    const msgObj = JSON.parse(decryptedData);
    writeChatBox(msgObj);

    if (Notification.permission === "granted" && document.hidden) {
      let notificationBody;
      if (msgObj.type === "message") {
        notificationBody = `${msgObj.user}: ${msgObj.text}`;
      } else {
        notificationBody = msgObj.text;
      }

      new Notification("Nova mensagem no Cript-Chat", {
        body: notificationBody,
      }).onclick = function () {
        document.getElementById("mensagem").focus();
        this.close();
      };
    }
  } catch (e) {
    console.error("Failed to decrypt or parse message:", e);
  }
};

socket.onclose = () =>
  writeChatBox({
    type: "system",
    text: "Conexão com o servidor perdida. Por favor, tente novamente mais tarde",
  });

async function sendMessage() {
  const messageInput = document.getElementById("mensagem");
  const messageText = messageInput.value;

  if (messageText == "" || messageText.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    messageInput.focus();
  } else {
    // Send user message as JSON object
    const payload = JSON.stringify({
      type: "message",
      user: nome,
      text: messageText,
    });

    socket.send(await encrypt(payload));
    messageInput.value = "";
    messageInput.focus();
  }
}

function writeChatBox(msgObj) {
  const chatBox = document.getElementById("chatBox");
  const p = document.createElement("p");

  if (msgObj.type === "message") {
    // Create bold element for username
    const b = document.createElement("b");
    b.textContent = msgObj.user + ": ";
    p.appendChild(b);

    // Append message text safely
    p.appendChild(document.createTextNode(msgObj.text));
  } else {
    // System messages
    p.textContent = msgObj.text;
  }

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
