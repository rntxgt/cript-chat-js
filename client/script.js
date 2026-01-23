const socket = new WebSocket("ws://localhost:8080");
const nome = prompt("Insira seu nome: ");

socket.onopen = () => {
  socket.send(`${nome} entrou`);
};

socket.onmessage = (message) => {
  document
    .getElementById("chatBox")
    .appendChild(document.createElement("option")).innerText = message.data;
  document.getElementById("chatBox").scrollTop =
    document.getElementById("chatBox").scrollHeight;
  console.log(message.data);
};

function sendMessage() {
  socket.send(nome + ": " + document.getElementById("mensagem").value);
  document.getElementById("mensagem").value = "";
  document.getElementById("mensagem").focus();
}
