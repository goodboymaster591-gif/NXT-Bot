/**
 * NXT Esports Discord Bot — Entry Point
 * Start with: node src/index.js
 * Deploy commands with: node src/deploy-commands.js
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const loadCommands = require('./handlers/commands.js');
const loadEvents = require('./handlers/events.js');
const logger = require('./utils/logger.js');

// ─── Client setup ─────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
  ],
});

// ─── Anti-spam tracker (in-memory) ───────────────────────────────────────────

client.spamTracker = new Map();

// ─── Load handlers ────────────────────────────────────────────────────────────

loadCommands(client);
loadEvents(client);

// ─── Login ────────────────────────────────────────────────────────────────────

const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('DISCORD_TOKEN is not set. Please set it in your environment variables.');
  process.exit(1);
}

client.login(token).catch((err) => {
  logger.error(`Failed to login: ${err.message}`);
  process.exit(1);
});

// ─── Global error handling ────────────────────────────────────────────────────

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`);
});
