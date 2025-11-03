class MascotGreetingModule {
  constructor(client, channel, mascotModule) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;
    this.mascotModule = mascotModule;
    this.seenUsers = new Set(); // pour suivre les pseudos déjà vus
  }

  onMessage(tags, message) {
    const username = tags.username?.toLowerCase(); // on normalise les noms

    if (!username || this.seenUsers.has(username)) {
      return;
    }

    this.seenUsers.add(username);

    // Envoie un message via la mascotte
    this.mascotModule.say(`Coucou ${username} !`);
  }

  // Optionnel : reset de la liste si besoin (ex: à chaque live)
  resetSeenUsers() {
    this.seenUsers.clear();
  }
}

module.exports = MascotGreetingModule;
