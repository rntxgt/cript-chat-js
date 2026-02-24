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
  try {
    const decrypted = await decrypt(message.data);
    let msgObj;

    try {
      msgObj = JSON.parse(decrypted);
    } catch (e) {
      // Legacy support: treat as plain text system message to avoid XSS
      msgObj = { type: "system", text: decrypted };
    }

    writeChatBox(msgObj);

    if (Notification.permission === "granted" && document.hidden) {
      let bodyText = msgObj.text;
      if (msgObj.type === "message") {
        bodyText = `${msgObj.user}: ${msgObj.text}`;
      }

      new Notification("Nova mensagem no Cript-Chat", {
        body: bodyText,
      }).onclick = function () {
        document.getElementById("mensagem").focus();
        this.close();
      };
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err);
  }
};

socket.onclose = () =>
  writeChatBox({
    type: "system",
    text: "Conexão com o servidor perdida. Por favor, tente novamente mais tarde",
  });

async function sendMessage() {
  const msgInput = document.getElementById("mensagem");
  if (msgInput.value == "" || msgInput.value.length >= 500) {
    alert("[ERRO] Digite uma mensagem válida!");
    msgInput.focus();
  } else {
    const payload = JSON.stringify({
      type: "message",
      user: nome,
      text: msgInput.value,
    });

    socket.send(await encrypt(payload));
    msgInput.value = "";
    msgInput.focus();
  }
}

function writeChatBox(messageObj) {
  const chatBox = document.getElementById("chatBox");
  const p = document.createElement("p");

  // Robustness check
  if (typeof messageObj !== "object" || messageObj === null) {
    messageObj = { type: "system", text: String(messageObj) };
  }

  if (messageObj.type === "message") {
    const b = document.createElement("b");
    b.textContent = messageObj.user + ": ";
    p.appendChild(b);
    p.appendChild(document.createTextNode(messageObj.text));
  } else {
    // System message or fallback
    p.textContent = messageObj.text || JSON.stringify(messageObj);
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
