// modules/ChannelsModule.js
class ChannelsModule {
  static getConfig() {
    return {
      commandCooldown: 1 * 1000, // Time before the command can be used again by chat to avoid spam (in milliseconds)
      autoMessageInterval: 42 * 60 * 1000, // Time between auto messages (in milliseconds)
      messageList: [
        `satani80Sataniheart Merci à ceux qui me suivent déjà ici et ailleurs 🙏
          Pensez à suivre la chaîne et rejoindre l'aventure → https://linktr.ee/satanimax`,
        `satani80Thinking Tu veux savoir quand on découvre la prochaine pépite indé ?
          Tous les liens sont là 👉 https://linktr.ee/satanimax`,
        `satani80Gg Le planning des lives, les jeux à venir, mes réseaux… tout est ici !  
          Un bon moyen de ne rien rater ➡️ https://linktr.ee/satanimax`,
        `satani80Gg Le planning des streams est sur Insta (et plus) via mon linktree !  
         ➡️ https://linktr.ee/satanimax
          Pense à suivre la chaîne si ce n’est pas déjà fait 😉  
         `,
      ],
      allowedCommandList: ["reseaux", "réseaux", "reseau", "réseau"],
    };
  }

  constructor(client, channel) {
    this.client = client;
    this.channel = channel;

    const config = this.constructor.getConfig();
    this.messageList = config.messageList;
    this.commandCooldown = config.commandCooldown;
    this.autoMessageInterval = config.autoMessageInterval;
    this.allowedCommandList = config.allowedCommandList;

    this.lastCommandTimestamp = 0;
    this.lastMessageIndex = -1;
    this.timer = null;

    this.resetTimer();
  }

  resetTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.sendMessage();
      this.resetTimer();
    }, this.autoMessageInterval);
  }

  sendMessage() {
    let index;
    do {
      index = Math.floor(Math.random() * this.messageList.length);
    } while (index === this.lastMessageIndex && this.messageList.length > 1);

    this.lastMessageIndex = index;
    const messageToSend = this.messageList[index];
    this.client.say(this.channel, messageToSend);
    console.log(`[ChannelsModule] Message sent: ${messageToSend}`);
  }

  isCommand(message) {
    const normalized = message
      .toLowerCase()
      .replace(/[!"]/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return this.allowedCommandList.includes(normalized);
  }

  onMessage(tags, message) {
    const now = Date.now();
    const trimmed = message.trim();

    if (!trimmed.startsWith("!")) return;

    if (this.isCommand(trimmed)) {
      if (now - this.lastCommandTimestamp < this.commandCooldown) {
        console.log("[ChannelsModule] Command ignored (cooldown)");
        return;
      }
      this.lastCommandTimestamp = now;
      this.resetTimer();
      this.sendMessage();
    }
  }
}

module.exports = ChannelsModule;
