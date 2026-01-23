const WebSocket = require("ws");
// Cria um servidor na porta 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log("Servidor rodando na porta 8080...");

wss.on("connection", (ws) => {
  // Evento: quando chega mensagem do cliente
  ws.on("message", (message) => {
    console.log("Recebido:", message.toString()); //temporário para testes

    // Broadcast: Envia a mensagem para todos os clientes conectados
    wss.clients.forEach((client) => {
      // Verifica se o cliente está com a conexão aberta antes de enviar
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // Envia uma mensagem de boas-vindas assim que conecta
  ws.send("Bem-vindo ao Cript-Chat!");
});
