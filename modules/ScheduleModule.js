require("dotenv").config();
const fs = require("fs");
const path = require("path");

class ScheduleModule {
  static getConfig() {
    return {
      commandList: ["!planning"],
      messageTemplate: "📅 Prochain live : {date} — « {title} »",
      noPlanningMessage: "📭 Aucun stream planifié pour le moment !",
      dateLocale: "fr-FR",
      timeZone: "Europe/Paris",
    };
  }

  constructor(client, channel) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;
    this.config = this.constructor.getConfig();
  }

  async onMessage(tags, message) {
    const msg = message.trim().toLowerCase();
    const cleanedMsg = msg.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (!this.config.commandList.includes(cleanedMsg)) return;

    console.log(`[ScheduleModule] Received command: ${message}`);

    try {
      const broadcasterId = await this.getBroadcasterId();
      const segments = await this.fetchSchedule(broadcasterId);

      if (!segments.length) {
        this.client.say(this.channel, this.config.noPlanningMessage);
        return;
      }

      const lines = segments.map((segment) => {
        const date = new Date(segment.start_time);
        const formattedDate = new Intl.DateTimeFormat(this.config.dateLocale, {
          weekday: "long",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: this.config.timeZone,
        }).format(date);

        const game = segment.category?.name || "Jeu à venir";

        return `📅 ${formattedDate} — ${game}`;
      });

      this.client.say(this.channel, "satani80Think Planning de la semaine :");
      lines.forEach((line) => {
        this.client.say(this.channel, line);
      });
    } catch (err) {
      console.error("[ScheduleModule] Error fetching schedule:", err.message);
    }
  }

  async fetchSchedule(broadcasterId) {
    const res = await fetch(`https://api.twitch.tv/helix/schedule?broadcaster_id=${broadcasterId}`, {
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${process.env.APP_TOKEN}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Twitch API error: ${res.status}`);
    }

    const json = await res.json();
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return (json.data?.segments || []).filter((segment) => {
      const start = new Date(segment.start_time);
      return start >= now && start <= oneWeekLater;
    });
  }

  // ⬇️ Fonction utilitaire pour récupérer le broadcaster_id
  async getBroadcasterId() {
    if (process.env.BROADCASTER_ID && process.env.BROADCASTER_ID.length > 0) {
      return process.env.BROADCASTER_ID;
    }

    const login = process.env.TWITCH_CHANNEL;
    if (!login) {
      throw new Error("Missing TWITCH_USERNAME in .env to fetch broadcaster_id");
    }

    const res = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${process.env.APP_TOKEN}`,
      },
    });

    if (!res.ok) {
      console.error("[ScheduleModule] Error fetching user ID from Twitch API:", res.status);
      console.log(res);
    }

    const data = await res.json();
    const id = data.data?.[0]?.id;

    if (!id) {
      throw new Error(`Could not retrieve broadcaster_id from Twitch API`);
    }

    console.log(`👉 BROADCASTER_ID found: ${id}`);
    updateEnvFileWithBroadcasterId(id);
    return id;
  }
}

module.exports = ScheduleModule;

function updateEnvFileWithBroadcasterId(id) {
  const envPath = path.resolve(__dirname, "..", ".env"); // ← adapte selon l'emplacement du module
  let envContent = fs.readFileSync(envPath, "utf-8");

  if (envContent.includes("BROADCASTER_ID=")) {
    envContent = envContent.replace(/BROADCASTER_ID=.*/g, `BROADCASTER_ID=${id}`);
  } else {
    envContent += `\nBROADCASTER_ID=${id}\n`;
  }

  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log("✅ .env updated with BROADCASTER_ID");
}
