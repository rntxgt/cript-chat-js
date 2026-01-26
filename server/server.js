const WebSocket = require("ws");
const os = require("os");

const wss = new WebSocket.Server({
  port: 8080,
  host:
    Object.values(os.networkInterfaces())
      .flat()
      .find((iface) => iface.family === "IPv4" && !iface.internal)?.address ||
    console.error("Nenhum endereço IP encontrado"),
});

console.log(
  `Servidor Cript-Chat rodando em ws://${wss.options.host}:${wss.options.port}`,
);

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
});
