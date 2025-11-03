const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const ApiServer = require("../apiServer");
require("dotenv").config();
const { updateVipStats } = require("../utils");

class MascotModule {
  constructor(client, channel, webSocketServer) {
    this.client = client;
    this.channel = channel;
    this.webSocketServer = webSocketServer;
    this.XP_BY_LEVEL = [2, 2, 3, 3, 4, 5];
    this.currentXp = 0;
    this.currentLevel = 1;
    this.LEVEL_MAX = this.XP_BY_LEVEL.length;

    this.webSocketServer.on("connection", (ws) => {
      console.log("Un client s'est connecté au WebSocket");
      const initialData = {
        type: "initial_data",
        level: this.currentLevel,
        xp: this.currentXp,
        nextLevelXp: this.XP_BY_LEVEL[this.currentLevel - 1] || 0,
      };
      ws.send(JSON.stringify(initialData));

      ws.on("close", () => {
        console.log("Le client s'est déconnecté du WebSocket");
      });
    });
  }

  incrementXp(username) {
    if (this.currentLevel >= this.LEVEL_MAX) {
      console.log("Niveau maximum atteint, pas d'XP supplémentaire.");
      return;
    }

    ++this.currentXp;
    console.log(`XP de la mascotte : ${this.currentXp}`);

    let message = {
      type: "xp_up",
      xp: this.currentXp,
    };
    let chatMessage = `💚 ${username} a donné de l'XP à Aspic !`;

    // ✅ Mettre à jour les stats pour ce viewer
    updateVipStats(username);

    if (this.currentXp >= this.XP_BY_LEVEL[this.currentLevel - 1]) {
      ++this.currentLevel;
      this.currentXp = 0;
      console.log(`Niveau de la mascotte : ${this.currentLevel}`);
      this.client.say(`#${this.channel}`, `🎉 La mascotte a atteint le niveau ${this.currentLevel} !`);

      message = {
        type: "level_up",
        level: this.currentLevel,
        nextLevelXp: this.XP_BY_LEVEL[this.currentLevel - 1] || 0,
      };
      chatMessage = `🎉 Aspic est passé au niveau ${this.currentLevel} grâce à ${username} !`;
    }

    this.client.say(this.channel, chatMessage);

    this.sendToClients(message);

    this.say(`Merci pour l'XP, ${username} !`);
  }

  say(message) {
    const sayMessage = {
      type: "say",
      text: message,
    };
    this.sendToClients(sayMessage);
  }

  sendToClients(message) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

module.exports = MascotModule;
