const localIp = prompt("Insira o IP do servidor: ");
const nome = prompt("Insira seu nome: ");
if (nome == "" || nome == null) {
  alert("[ERRO] Nome inválido!");
  location.reload();
}
const socket = new WebSocket(`ws://${localIp}:8080`);

socket.onopen = () => {
  socket.send(`${nome} entrou`);
};

socket.onmessage = (message) => {
  document
    .getElementById("chatBox")
    .appendChild(document.createElement("p")).innerHTML = message.data;
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
};

socket.onclose = () => {
  document
    .getElementById("chatBox")
    .appendChild(document.createElement("p")).innerText =
    `Conexão com o servidor perdida. Por favor, tente novamente mais tarde`;
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
};

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
