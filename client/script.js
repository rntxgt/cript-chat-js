const localIp = prompt("Insira o IP do servidor: ");
const nome = prompt("Insira seu nome: ");
let key = prompt("Insira a chave: ");
key += "2yCH5xqdCU7ja0dE";

// permissão de notificação
if (window.Notification && Notification.permission === "default") {
  Notification.requestPermission();
}

if (nome == "" || nome == null || key == "" || key == null) {
  alert("[ERRO] Nome ou chave inválidos!");
  location.reload();
}

const socket = new WebSocket(`ws://${localIp}:8080`);

socket.onopen = () => {
  writeChatBox("Bem-vindo ao Cript-Chat!");
  socket.send(`${nome} entrou`);
};

socket.onmessage = (message) => {
  writeChatBox(message.data);

  // notificação
  if (Notification.permission === "granted" && document.hidden) {
    new Notification("Nova mensagem no Cript-Chat", {
      body: message.data.replace("<b>", "").replace("</b>", ""),
    });
  }
};

socket.onclose = () =>
  writeChatBox(
    `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`,
  );

function sendMessage() {
  if (
    document.getElementById("mensagem").value == "" ||
    document.getElementById("mensagem").value.length >= 500
  ) {
    alert("[ERRO] Digite uma mensagem válida!");
    document.getElementById("mensagem").focus();
  } else {
    socket.send(
      "<b>" + nome + ": </b>" + document.getElementById("mensagem").value,
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

async function hash(key) {
  return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
}

// gera a chave

async function makeKey(hashBuffer) {
  return await crypto.subtle.importKey("raw", hashBuffer, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// somente testa a chave

hash(key)
  .then((hashBuffer) => {
    return makeKey(hashBuffer);
  })
  .then((cryptoKey) => {
    console.log(cryptoKey);
  });
