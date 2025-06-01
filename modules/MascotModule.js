const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
require("dotenv").config();

class MascotModule {
  constructor(client, channel) {
    this.client = client;
    this.channel = channel;
    this.rankingsStatsFile = path.join(__dirname, "..", "data", "rankings.json");

    this.webSocketServer = new WebSocket.Server({ port: 8080 });
    this.XP_BY_LEVEL = [2, 3, 4, 5, 6, 7];
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

    // ✅ Mettre à jour les stats pour ce viewer
    this.updateAspicStats(username);

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
    }

    this.sendToClients(message);
  }

  updateAspicStats(username) {
    let stats = {};

    if (fs.existsSync(this.rankingsStatsFile)) {
      stats = JSON.parse(fs.readFileSync(this.rankingsStatsFile, "utf-8") || "{}");
    }

    if (!stats[username]) {
      stats[username] = { asdor: 0, aspic: 0 };
    }

    stats[username].aspic = (stats[username].aspic || 0) + 1;

    fs.writeFileSync(this.rankingsStatsFile, JSON.stringify(stats, null, 2), "utf-8");
    console.log(`[MascotModule] 📝 XP ajouté à ${username} dans stats.json`);
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
