const WebSocket = require("ws");

class WebSocketServerSingleton {
  constructor() {
    if (!WebSocketServerSingleton.instance) {
      this.server = new WebSocket.Server({ port: 8080 });
      this.server.on("connection", (ws) => {
        console.log("🟢 Un client WebSocket s'est connecté.");
        ws.on("close", () => {
          console.log("🔴 Le client WebSocket s'est déconnecté.");
        });
      });
      WebSocketServerSingleton.instance = this;
    }

    return WebSocketServerSingleton.instance;
  }

  getServer() {
    return this.server;
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

const instance = new WebSocketServerSingleton();
Object.freeze(instance);
module.exports = instance;
