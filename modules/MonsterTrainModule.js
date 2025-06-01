const path = require("path");
require("dotenv").config();

class MonsterTrainModule {
  static getConfig() {
    return {
      rollCooldown: 5 * 1000, // 5 secondes
      carteCooldown: 5 * 1000, // 5 secondes
    };
  }

  constructor(client, channel) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;
    this.config = this.constructor.getConfig();
    this.lastRollTime = 0;
    this.lastCarteTime = 0;
  }

  onMessage(tags, message) {
    const msg = message.trim().toLowerCase();

    if (msg.startsWith("!roll")) {
      const now = Date.now();
      if (now - this.lastRollTime < this.config.rollCooldown) {
        return; // Cooldown
      }
      this.lastRollTime = now;

      const args = msg.split(" ");
      const isHeros = args.length > 1 && args[1] === "heros";
      this.handleRoll(tags.username, isHeros);
    }

    if (msg === "!carte") {
      const now = Date.now();
      if (now - this.lastCarteTime < this.config.carteCooldown) {
        return; // Cooldown
      }
      this.lastCarteTime = now;
      this.handleCarte(tags.username);
    }
  }

  handleRoll(username, isHeros) {
    let choice;
    if (isHeros) {
      choice = Math.random() < 0.5 ? "gauche" : "droite";
    } else {
      // gauche et droite avec poids 2, skip avec poids 1
      const options = ["gauche", "gauche", "droite", "droite", "passer"];
      const randIndex = Math.floor(Math.random() * options.length);
      choice = options[randIndex];
    }

    let msg;
    if (isHeros) {
      msg = `🦸‍♂️ ${username} t'invite à choisir l'évolution du héros de ${choice}`;
    } else {
      if (choice === "passer") {
        msg = `🤷‍♂️ ${username} t'impose de passer ce choix !`;
      } else {
        msg = `🎲 ${username} t'impose de prendre le choix de ${choice} !`;
      }
    }

    this.client.say(this.channel, msg);
    console.log(`[MonsterTrainModule] ${msg}`);
  }

  handleCarte(username) {
    // gauche, milieu, droite, et skip avec un poids plus faible
    const options = ["gauche", "gauche", "milieu", "milieu", "droite", "droite", "passer"];
    const randIndex = Math.floor(Math.random() * options.length);
    const choice = options[randIndex];

    let msg;
    if (choice === "passer") {
      msg = `🤷‍♂️ ${username} te demande de passer cette récompense!`;
    } else {
      msg = `🃏 ${username} te demande de prendre la carte ${choice === "milieu" ? "du milieu" : `de ${choice}`} !`;
    }

    this.client.say(this.channel, msg);
    console.log(`[MonsterTrainModule] ${msg}`);
  }
}

module.exports = MonsterTrainModule;
