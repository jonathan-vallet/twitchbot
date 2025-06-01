require("dotenv").config();

class VipGameModule {
  static getConfig() {
    return {
      command: "!vipgame",
      messageList: [
        "🌟 Le Concours de l'As d'or et de la mascotte !",
        "Chaque mois, les points suivants sont attribués :",
        "🏆 Obtenir l'As d'or → +5 points",
        "🌱 Offrir de l'XP à la mascotte → +1 point",
        "Le top 3 du mois gagne le badge VIP pour le mois suivant !",
        // Tape !classement pour voir les scores actuels et tenter de décrocher le badge VIP ! ✨`,
      ],
      cooldown: 60 * 1000, // 60 secondes
    };
  }

  constructor(client, channel) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;
    this.config = this.constructor.getConfig();
    this.lastUsed = 0;
  }

  onMessage(tags, message) {
    const msg = message.trim().toLowerCase();
    if (msg !== this.config.command) return;

    const now = Date.now();
    if (now - this.lastUsed < this.config.cooldown) {
      console.log("[VipGameModule] Cooldown actif, commande ignorée");
      return;
    }

    this.lastUsed = now;
    this.config.messageList.forEach((msg) => {
      this.client.say(this.channel, msg);
    });
    console.log(`[VipGameModule] Message envoyé pour la commande ${this.config.command}`);
  }
}

module.exports = VipGameModule;
