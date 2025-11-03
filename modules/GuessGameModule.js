const fs = require("fs");
const path = require("path");
const ApiServer = require("../apiServer");
const { updateVipStats } = require("../utils");

class GuessGameModule {
  constructor(client, channel, mascotWebSocketServer) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;
    this.wsServer = mascotWebSocketServer;
    this.rewardTitle = "Devine le jeu"; // Nom exact de la récompense Twitch
    this.screenshotsDir = path.resolve(__dirname, "../screenshots");
    this.isGameRunning = false;
    this.currentAnswer = null;
    this.timeout = null;

    this.client.on("message", (channel, tags, message, self) => {
      if (self) return;

      this.onMessage(tags, message);
    });
  }

  onRewardRedemption(tags) {
    if (this.isGameRunning) {
      return;
    }

    const files = fs.readdirSync(this.screenshotsDir).filter((f) => f.endsWith(".jpg"));
    if (files.length === 0) {
      console.error("Aucun screenshot disponible pour le jeu de devinette.");
      return;
    }
    const randomFile = files[Math.floor(Math.random() * files.length)];
    this.currentAnswer = path.basename(randomFile, ".jpg").toLowerCase().replace(/-/g, " "); // nom du jeu

    this.isGameRunning = true;
    this.broadcast({
      type: "guess_game_start",
      image: `screenshots/${randomFile}`,
    });

    this.client.say(this.channel, "🎮 Devine le jeu affiché ! Vous avez 30 secondes.");

    this.timeout = setTimeout(() => {
      this.client.say(this.channel, `⏱️ Temps écoulé ! Le jeu était : ${this.currentAnswer.charAt(0).toUpperCase() + this.currentAnswer.slice(1)}`);
      this.stopGame();
    }, 30_000);
  }

  onMessage(tags, message) {
    if (!this.isGameRunning || !this.currentAnswer) {
      return;
    }
    console.log(`🕵️‍♂️ ${tags["display-name"]} a proposé : ${message}`);

    const guess = message.trim().toLowerCase();
    if (guess.includes(this.currentAnswer)) {
      clearTimeout(this.timeout);
      this.client.say(
        this.channel,
        `🎉 Bravo @${tags["display-name"]} ! C'était bien ${this.currentAnswer.charAt(0).toUpperCase() + this.currentAnswer.slice(1)}`
      );
      updateVipStats(tags["display-name"]);

      this.stopGame();
    }
  }

  stopGame() {
    this.isGameRunning = false;
    this.currentAnswer = null;
    this.broadcast({ type: "guess_game_stop" });
  }

  broadcast(data) {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify(data));
    });
  }
}

module.exports = GuessGameModule;
