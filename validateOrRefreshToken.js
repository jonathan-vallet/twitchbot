require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { fetch } = require("undici"); // plus léger et natif dans Node 18+

async function validateAccessToken(token) {
  const res = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `Oauth oauth:${token}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  return json;
}

async function refreshAccessToken() {
  const url = `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${process.env.REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`;

  const res = await fetch(url, {
    method: "POST",
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Failed to refresh token: " + errorText);
  }

  const json = await res.json();

  return {
    accessToken: `${json.access_token}`,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
  };
}

function updateEnvFile(newAccessToken, newRefreshToken) {
  const envPath = path.resolve(__dirname, ".env");
  let envContent = fs.readFileSync(envPath, "utf-8");

  envContent = envContent.replace(/ACCESS_TOKEN=.*\n?/, `ACCESS_TOKEN=${newAccessToken}\n`);
  envContent = envContent.replace(/REFRESH_TOKEN=.*/g, `REFRESH_TOKEN=${newRefreshToken}`);

  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log("✅ .env updated with new tokens");
}

(async () => {
  console.log("🔍 Checking token validity...");
  const result = await validateAccessToken(process.env.ACCESS_TOKEN);

  if (result) {
    console.log(`✅ Token is valid for user "${result.login}" (expires in ${result.expires_in}s)`);
    return;
  }

  console.log("⚠️ Token is invalid. Attempting refresh...");

  try {
    const { accessToken, refreshToken, expiresIn } = await refreshAccessToken();

    console.log(`✅ New token received. Expires in ${Math.round(expiresIn / 60)} minutes`);
    updateEnvFile(accessToken, refreshToken);
  } catch (err) {
    console.error("❌ Failed to refresh token:", err.message);
  }
})();
