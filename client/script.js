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
  // Send entry message as JSON
  socket.send(
    await encrypt(
      JSON.stringify({ type: "system", text: `${nome} entrou` }),
    ),
  );
};

socket.onmessage = async (message) => {
  let decrypted;
  try {
    decrypted = await decrypt(message.data);
  } catch (err) {
    console.error("Falha ao descriptografar mensagem", err);
    return;
  }

  let msgObj;
  try {
    msgObj = JSON.parse(decrypted);
    // Basic validation of message structure
    if (!msgObj || typeof msgObj !== "object" || !msgObj.type) {
      throw new Error("Formato inválido");
    }
  } catch (e) {
    // Fallback for legacy messages or non-JSON content
    // We treat it as a system message with the raw text (safe from XSS because writeChatBox uses textContent)
    msgObj = { type: "system", text: decrypted };
  }

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
};

socket.onclose = () =>
  writeChatBox({
    type: "system",
    text: `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
  });

async function sendMessage() {
  const input = document.getElementById("mensagem");
  if (input.value == "" || input.value.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    input.focus();
  } else {
    // Send user message as JSON
    const payload = {
      type: "message",
      user: nome,
      text: input.value,
    };
    socket.send(await encrypt(JSON.stringify(payload)));
    input.value = "";
    input.focus();
  }
}

function writeChatBox(msgObj) {
  const chatBox = document.getElementById("chatBox");
  const p = document.createElement("p");

  if (msgObj.type === "message") {
    // User message: <b>User: </b> Message
    const b = document.createElement("b");
    b.textContent = msgObj.user + ": ";
    p.appendChild(b);
    p.appendChild(document.createTextNode(msgObj.text));
  } else {
    // System message or fallback: just text
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
