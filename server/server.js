const WebSocket = require("ws");
const os = require("os");

function getLocalIp() {
  return (
    Object.values(os.networkInterfaces())
      .flat()
      .find((iface) => iface.family === "IPv4" && !iface.internal)?.address ||
    console.error("Nenhum endereço IP encontrado")
  );
}

// Cria um servidor na porta 8080
const wss = new WebSocket.Server({
  port: 8080,
  host: getLocalIp(),
});

console.log(
  `Servidor WebSocket rodando em ws://${getLocalIp()}:${wss.options.port}`,
);

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
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
