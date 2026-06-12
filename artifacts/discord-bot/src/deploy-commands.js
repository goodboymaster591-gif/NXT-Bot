/**
 * Deploy slash commands to Discord.
 * Run this script once after adding or changing commands:
 *   node src/deploy-commands.js
 *
 * Required env vars:
 *   DISCORD_TOKEN       — your bot token
 *   DISCORD_CLIENT_ID   — your application's client/app ID
 *   DISCORD_GUILD_ID    — your server ID (for guild-scoped instant deploy)
 *                         Leave empty to deploy globally (up to 1hr propagation)
 */

const { REST, Routes } = require('@discordjs/rest');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
  process.exit(1);
}

const commands = [];

function loadDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const cmd = require(fullPath);
      if (cmd.data) commands.push(cmd.data.toJSON());
    }
  }
}

loadDir(path.join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Deploying ${commands.length} commands...`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✅ Deployed ${commands.length} commands to guild ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`✅ Deployed ${commands.length} commands globally (up to 1hr propagation)`);
    }
  } catch (err) {
    console.error('❌ Deploy failed:', err.message);
    process.exit(1);
  }
})();
