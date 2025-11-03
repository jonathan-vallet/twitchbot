require("dotenv").config();
const WebSocketServer = require("./websocketServer");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { StaticAuthProvider } = require("@twurple/auth");
const fs = require("fs");
const MastcotModule = require("./modules/MascotModule");
const GuessGameModule = require("./modules/GuessGameModule");
const RankingsModule = require("./modules/RankingsModule");
const { updateVipStats } = require("./utils");

class ApiServer {
  constructor(client, channel) {
    this.client = client;
    this.wsServer = WebSocketServer.getServer();
    this.authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.ACCESS_TOKEN);
    this.lastGoldenFile = "C:/Users/Utilisateur/Pictures/Streaming/OBS/golden.txt";
    this.startServer();
    this.startListener().catch(console.error);
    this.mascotModule = new MastcotModule(client, channel, this.wsServer);
    this.guessGameModule = new GuessGameModule(client, channel, this.wsServer);
  }

  getMascotModule() {
    return this.mascotModule;
  }

  startServer() {
    this.apiClient = new ApiClient({
      authProvider: this.authProvider,
    });
  }

  async startListener() {
    const listener = new EventSubWsListener({ apiClient: this.apiClient });

    await listener.start();

    console.log("✅ WebSocket EventSub started");

    const broadcasterId = process.env.BROADCASTER_ID;

    // Subscribe to channel points redemptions
    listener.onChannelRedemptionAdd(broadcasterId, (event) => {
      const reward = event.rewardTitle;
      const user = event.userDisplayName;

      console.log(`🎁 ${user} a utilisé la récompense : ${reward}`);

      if (reward === "l'As d'or") {
        const msg = `🏆 Félicitations @${user} ! Tu as décroché l’As d’or du stream 🎉`;
        this.client.say(`#${process.env.TWITCH_CHANNEL}`, msg);
        console.log(`🏆 ${user} a gagné l’As d’or !`);
        fs.writeFile(this.lastGoldenFile, user, (err) => {
          if (err) {
            console.error("❌ Erreur lors de l'écriture du fichier :", err);
          } else {
            console.log(`✅ ${user} a été enregistré dans le fichier ${this.lastGoldenFile}`);
          }
        });
        updateVipStats(user);
        RankingsModule.showRankings(this.client, `#${process.env.TWITCH_CHANNEL}`, true);
        console.log(`📝 Statistiques mises à jour pour ${user}`);
      } else if (reward === "Level up Aspic") {
        this.mascotModule.incrementXp(user);
      } else if (reward === "Devine le jeu") {
        console.log("🔍 Un utilisateur a déclenché Devine le jeu.");
        this.guessGameModule.onRewardRedemption(event);
      }
    });

    // Listener for channel follow events
    listener.onChannelFollow(broadcasterId, broadcasterId, (event) => {
      const follower = event.userDisplayName;

      console.log(`✨ Nouveau follow : ${follower}`);
      this.client.say(`#${process.env.TWITCH_CHANNEL}`, `🎉 Merci pour le follow, @${follower} !`);
      this.mascotModule.say(`Merci pour le follow, ${follower} !`);

      // Enregistrer dans un fichier
      const followPath = "C:/Users/Utilisateur/Pictures/Streaming/OBS/follower.txt";
      fs.writeFile(followPath, follower, (err) => {
        if (err) {
          console.error("❌ Erreur lors de l'écriture du follower :", err);
        } else {
          console.log(`✅ Dernier follower enregistré : ${follower}`);
        }
      });
    });

    listener.onChannelPollBegin(broadcasterId, (event) => {
      console.log(`📊 Nouveau sondage : ${event.title}`);
      const title = event.title;
      const choices = event.choices.map((c) => c.title).join(" / ");
      const msg = `📢 Nouveau sondage lancé : ${title} → ${choices}`;
      this.client.say(`#${process.env.TWITCH_CHANNEL}`, msg);
    });

    listener.onChannelPollEnd(broadcasterId, (event) => {
      console.log(`📊 Fin sondage : ${event.title}`);
      const winningChoice = event.choices.sort((a, b) => b.totalVotes - a.totalVotes)[0];
      console.log(event);
      const msg = `🏁 Fin du sondage → Résultat : ${winningChoice.title} avec ${winningChoice.totalVotes} vote${winningChoice.totalVotes !== 1 ? "s" : ""}`;
      this.client.say(`#${process.env.TWITCH_CHANNEL}`, msg);
    });
  }
}

module.exports = ApiServer;
