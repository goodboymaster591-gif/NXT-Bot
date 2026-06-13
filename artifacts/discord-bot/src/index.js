/**
 * NXT Esports Discord Bot — Entry Point
 * Start with: node src/index.js
 * Deploy commands with: node src/deploy-commands.js
 */

const http = require('http');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const loadCommands = require('./handlers/commands.js');
const loadEvents = require('./handlers/events.js');
const logger = require('./utils/logger.js');

// ─── Status web server ────────────────────────────────────────────────────────
// Serves a status dashboard + keeps the process alive for deployment health checks.

const HEALTH_PORT = parseInt(process.env.PORT || '3000', 10);

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function statusPage(client) {
  const isReady = client && client.isReady();
  const uptime = formatUptime(process.uptime());
  const guilds = isReady ? client.guilds.cache.size : 0;
  const users = isReady ? client.guilds.cache.reduce((a, g) => a + g.memberCount, 0) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NXT Esports — Bot Status</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0f0f17;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2rem;padding:2rem}
    .logo{font-size:3rem;font-weight:900;background:linear-gradient(135deg,#8b5cf6,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-1px}
    .tagline{color:#6b7280;font-size:1rem;letter-spacing:3px;text-transform:uppercase;margin-top:-1rem}
    .card{background:#1a1a2e;border:1px solid #2d2d4e;border-radius:16px;padding:2rem 2.5rem;width:100%;max-width:480px}
    .status-row{display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem}
    .dot{width:12px;height:12px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;animation:pulse 2s infinite}
    .dot.offline{background:#ef4444;box-shadow:0 0 8px #ef4444;animation:none}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    .status-label{font-size:1.1rem;font-weight:600;color:#f1f5f9}
    .stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1.5rem}
    .stat{background:#0f0f17;border-radius:10px;padding:1rem;text-align:center}
    .stat-val{font-size:1.6rem;font-weight:700;color:#8b5cf6}
    .stat-lbl{font-size:.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:.25rem}
    .footer{color:#6b7280;font-size:.75rem;text-align:center;letter-spacing:2px;text-transform:uppercase}
    .btn{display:inline-block;margin-top:.5rem;padding:.75rem 1.5rem;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:.9rem;transition:opacity .2s;width:100%;text-align:center}
    .btn:hover{opacity:.85}
  </style>
  <meta http-equiv="refresh" content="30" />
</head>
<body>
  <div class="logo">⚡ NXT</div>
  <div class="tagline">Next Up · Fortnite Esports</div>
  <div class="card">
    <div class="status-row">
      <div class="dot${isReady ? '' : ' offline'}"></div>
      <span class="status-label">${isReady ? 'Bot is Online' : 'Bot is Starting...'}</span>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-val">${guilds}</div><div class="stat-lbl">Servers</div></div>
      <div class="stat"><div class="stat-val">${users.toLocaleString()}</div><div class="stat-lbl">Members</div></div>
      <div class="stat"><div class="stat-val">${uptime}</div><div class="stat-lbl">Uptime</div></div>
    </div>
    <a class="btn" href="https://discord.gg/nxtesports">Join NXT Esports ⚡</a>
  </div>
  <div class="footer">⚡ NXT | NEXT UP</div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bot: 'NXT Bot', uptime: process.uptime(), ready: client && client.isReady() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(statusPage(client));
  }
}).listen(HEALTH_PORT, () => {
  logger.info(`Status dashboard on http://localhost:${HEALTH_PORT}`);
});

// ─── Client setup ─────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,    // Privileged — enable in Dev Portal
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,  // Privileged — enable in Dev Portal
    GatewayIntentBits.GuildModeration,
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
