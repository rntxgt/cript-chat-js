const socket = new WebSocket("ws://localhost:8080");
const nome = prompt("Insira seu nome: ");

if (nome == null) {
  alert("[ERRO] Nome inválido!");
  location.reload();
}

socket.onopen = () => {
  socket.send(`${nome} entrou`);
};

socket.onmessage = (message) => {
  document
    .getElementById("chatBox")
    .appendChild(document.createElement("option")).innerText = message.data;
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
};

function sendMessage() {
  if (
    document.getElementById("mensagem").value == "" ||
    document.getElementById("mensagem").value.length > 200
  ) {
    alert("[ERRO] Digite uma mensagem válida!");
    document.getElementById("mensagem").focus();
    return;
  }
  socket.send(nome + ": " + document.getElementById("mensagem").value);
  document.getElementById("mensagem").value = "";
  document.getElementById("mensagem").focus();
}
