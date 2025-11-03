# Twitch bot 🤖🔥

A simple, customizable Twitch bot that runs on your computer.

No need to code: just edit one file to configure messages and timing.  
Designed for streamers who want more control and fun in their chat!

---

## ✨ What can it do?

- Send messages automatically every X minutes
- Respond to custom commands (like `!réseaux`)
- Works 100% locally (no cloud, no hosting needed)

---

## 📦 How to install it

### 1. Download the bot

Go to the **Releases** section on GitHub and download the latest `.zip`:  
👉 [https://github.com/jonathan-vallet/twitchbot/releases](https://github.com/jonathan-vallet/twitchbot/releases)

Unzip the folder somewhere on your computer.

---

### 2. Install Node.js

Download and install Node.js (version 20 or higher):

🔗 [https://nodejs.org/en](https://nodejs.org/en)

> During setup, make sure **"Add to PATH"** is checked so you can run `node`.

---

### 3. Install the bot dependencies

In the unzipped folder, open the folder in your terminal and run:

```bash
npm install
```

### 4. Set up your Twitch config

Copy the file named .env.dist to .env.

Fill in your Twitch bot account information:

BOT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxx
BOT_REFRESH_TOKEN=xxxxxxxxxxxxxxxxxxxx
CLIENT_ID=xxxxxxxxxxxxxxxxxxxx

TWITCH_USERNAME=YourBotUsername
TWITCH_CHANNEL=yourchannelname

> ⚠️ **Your token must have access to the following scopes:**  
> `chat:read` and `chat:edit`  
> You can generate one here: [https://twitchtokengenerator.com/](https://twitchtokengenerator.com/)

### 5. Create a file to store the last games

Create a file named `lastGames.json` in the folder `data/` (create the `data` folder if it doesn't exist).

```bash
mkdir data
touch data/lastGames.json
```

## Start the bot

In the folder where the bot is located:

1. Right-click in the folder and choose **“Open in Terminal”** (or open a terminal manually)
2. Run the following command:

```bash
node twitchbot.js
npx http-server . --port 8000
```

If everything is set up correctly, you will see a message like:

```
[TwitchBot] Connected to ***.twitch.tv:443 as MyBotName
[TwitchBot] Connected to channel channelname
```
