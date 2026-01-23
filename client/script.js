// Usa a API nativa do navegador
const socket = new WebSocket("ws://localhost:8080");
const nome = prompt("Insira seu nome: ");

// Quando recebe mensagem
socket.onmessage = (message) => {
  console.log(message.data);
};

function sendMessage(message) {
  socket.send(nome + ": " + message);
}
