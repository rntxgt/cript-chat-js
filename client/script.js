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
  writeChatBox("Bem-vindo ao Cript-Chat!");
  socket.send(
    await encrypt(JSON.stringify({ type: "system", text: `${nome} entrou` })),
  );
};

socket.onmessage = async (message) => {
  let msg = await decrypt(message.data);
  let notificationBody = msg;

  try {
    const data = JSON.parse(msg);
    if (data.type === "message") {
      notificationBody = `${data.user}: ${data.text}`;
    } else if (data.type === "system") {
      notificationBody = data.text;
    }
  } catch (e) {
    // legacy
    notificationBody = msg.replace(/<[^>]*>?/gm, "");
  }

  writeChatBox(msg);

  if (Notification.permission === "granted" && document.hidden) {
    new Notification("Nova mensagem no Cript-Chat", {
      body: notificationBody,
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
  if (
    document.getElementById("mensagem").value == "" ||
    document.getElementById("mensagem").value.length >= 500
  ) {
    alert("[ERRO] Digite uma mensagem válida!");
    document.getElementById("mensagem").focus();
  } else {
    socket.send(
      await encrypt(
        JSON.stringify({
          type: "message",
          user: nome,
          text: document.getElementById("mensagem").value,
        }),
      ),
    );
    document.getElementById("mensagem").value = "";
    document.getElementById("mensagem").focus();
  }
}

function writeChatBox(messageChatBox) {
  const p = document.createElement("p");
  try {
    const data = JSON.parse(messageChatBox);
    if (data.type === "message") {
      const b = document.createElement("b");
      b.textContent = data.user + ": ";
      p.appendChild(b);
      p.appendChild(document.createTextNode(data.text));
    } else if (data.type === "system") {
      p.textContent = data.text;
    } else {
      p.textContent = data.text || JSON.stringify(data);
    }
  } catch (e) {
    p.textContent = messageChatBox;
  }
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
