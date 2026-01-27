const localIp = prompt("Insira o IP do servidor: ");
const nome = prompt("Insira seu nome: ");
let key = prompt("Insira a chave: ");
key += "2yCH5xqdCU7ja0dE";
const iv = window.crypto.getRandomValues(new Uint8Array(12));

if (!nome || !key) {
  alert("[ERRO] Nome ou chave inválidos!");
  location.reload();
}

if (window.Notification && Notification.permission === "default") {
  Notification.requestPermission();
}

const socket = new WebSocket(`ws://${localIp}:8080`);
socket.binaryType = "arraybuffer";

socket.onopen = async () => {
  writeChatBox("Bem-vindo ao Cript-Chat!");
  socket.send(await encrypt(`${nome} entrou`));
};

socket.onmessage = async (message) => {
  let msg;
  writeChatBox((msg = await decrypt(message.data)));

  if (Notification.permission === "granted" && document.hidden) {
    new Notification("Nova mensagem no Cript-Chat", {
      body: msg.replace("<b>", "").replace("</b>", ""),
    });
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
        "<b>" + nome + ": </b>" + document.getElementById("mensagem").value,
      ),
    );
    document.getElementById("mensagem").value = "";
    document.getElementById("mensagem").focus();
  }
}

function writeChatBox(messageChatBox) {
  document
    .getElementById("chatBox")
    .appendChild(document.createElement("p")).innerHTML = messageChatBox;
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
}

// gera hash da chave
async function hash() {
  return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
}

// gera a chave
async function cryptoKey() {
  return await crypto.subtle.importKey("raw", await hash(), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// criptografa a mensagem
async function encrypt(msg) {
  return await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await cryptoKey(),
    new TextEncoder().encode(msg),
  );
}

// descriptografa a mensagem
async function decrypt(msg) {
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await cryptoKey(),
      msg,
    ),
  );
}
