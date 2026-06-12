# ⚡ NXT Esports Discord Bot

A professional Discord bot for the NXT Esports Fortnite organization. Built with Discord.js v14, SQLite persistence, and a clean modular file structure.

---

## 🚀 Quick Start

### 1. Set Environment Variables

Add these to your Replit Secrets (or `.env` for local):

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot's token (from Discord Developer Portal) |
| `DISCORD_CLIENT_ID` | Your application's Client/App ID |
| `DISCORD_GUILD_ID` | Your server's ID (for instant slash command deployment) |

### 2. Install Dependencies

```bash
pnpm --filter @workspace/discord-bot install
```

### 3. Deploy Slash Commands

Run this **once** after any command changes:

```bash
pnpm --filter @workspace/discord-bot run deploy
```

### 4. Start the Bot

```bash
pnpm --filter @workspace/discord-bot run start
```

---

## 📁 File Structure

```
src/
├── index.js              — Entry point (creates client, loads handlers)
├── config.js             — 🔧 Edit this! Colors, roles, channels, rules
├── deploy-commands.js    — Registers slash commands with Discord
│
├── commands/
│   ├── general/          — /help /ping /serverinfo /userinfo /avatar /socials /rules /requirements
│   ├── applications/     — /apply (competitive, creator, designer, editor)
│   ├── tickets/          — /panel (support, application, report tickets)
│   ├── recruitment/      — /recruit /accept /deny /promote /demote
│   ├── roster/           — /roster /player /teamstats
│   ├── scrims/           — /scrim create|attendance
│   ├── events/           — /event create|end|results
│   ├── vouches/          — /vouch /vouches
│   ├── moderation/       — /warn /mute /kick /ban /purge /warnings
│   └── setup/            — /setup (interactive configuration wizard)
│
├── events/
│   ├── ready.js          — Bot startup
│   ├── interactionCreate.js — Routes all interactions (commands/buttons/modals)
│   ├── guildMemberAdd.js — Welcome messages + auto-role
│   ├── guildMemberRemove.js — Leave logs
│   ├── messageCreate.js  — Anti-spam + anti-invite
│   ├── messageDelete.js  — Deleted message logs
│   ├── messageUpdate.js  — Edited message logs
│   └── guildMemberUpdate.js — Role/nickname change logs
│
├── handlers/
│   ├── commands.js       — Auto-loads all command files
│   └── events.js         — Auto-loads all event files
│
└── utils/
    ├── database.js       — SQLite (better-sqlite3) — all data storage
    ├── embeds.js         — Shared embed builders
    └── logger.js         — Colored console logger

data/
└── nxt.db               — Auto-created SQLite database (all persistent data)
```

---

## ⚙️ Configuration

Edit `src/config.js` to customize:

- **`color`** — Primary embed color (default: `#8B5CF6` purple)
- **`footer`** — Embed footer text (default: `⚡ NXT | NEXT UP`)
- **`socials`** — Your social media links for `/socials`
- **`roles`** — Discord role names (must match exactly!)
- **`rules`** — Server rules shown by `/rules`
- **`requirements`** — Roster requirements shown by `/requirements`
- **`antiSpam`** — Spam detection sensitivity

---

## 📋 Command Reference

### General
| Command | Description |
|---|---|
| `/help` | All commands by category |
| `/ping` | Bot latency |
| `/serverinfo` | Server details |
| `/userinfo [user]` | User info |
| `/avatar [user]` | User avatar |
| `/socials` | NXT social links |
| `/rules` | Server rules |
| `/requirements` | Roster requirements |

### Applications
| Command | Description |
|---|---|
| `/apply` | Opens application panel (Competitive/Creator/Designer/Editor) |

### Tickets
| Command | Description |
|---|---|
| `/panel` | Creates support ticket panel (Support/Application/Report) |

### Recruitment
| Command | Description |
|---|---|
| `/recruit` | Post recruitment announcement |
| `/accept @user role` | Accept member |
| `/deny @user` | Deny member |
| `/promote @user role` | Promote member |
| `/demote @user role` | Demote member |

### Roster
| Command | Description |
|---|---|
| `/roster` | Full roster list |
| `/player add @user role` | Add to roster |
| `/player remove @user` | Remove from roster |
| `/teamstats` | Team statistics |

### Scrims
| Command | Description |
|---|---|
| `/scrim create` | Create scrim with attendance buttons |
| `/scrim attendance` | View current scrim attendance |

### Events / Tournaments
| Command | Description |
|---|---|
| `/event create` | Create tournament announcement |
| `/event end` | End active event |
| `/event results` | Post leaderboard results |

### Vouches
| Command | Description |
|---|---|
| `/vouch @user` | Leave a vouch |
| `/vouches [@user]` | View vouches |

### Moderation (Staff only)
| Command | Description |
|---|---|
| `/warn @user reason` | Warn member |
| `/mute @user duration` | Timeout member |
| `/kick @user` | Kick member |
| `/ban @user` | Ban member |
| `/purge amount` | Delete messages |
| `/warnings list @user` | View warning history |
| `/warnings clear @user` | Clear all warnings |

### Setup (Admin only)
| Command | Description |
|---|---|
| `/setup` | Interactive configuration wizard |

---

## 🔧 Setup Guide (First Time)

1. **Create Discord Application** at https://discord.com/developers/applications
2. **Enable Privileged Intents**: Server Members, Message Content, Presence
3. **Invite Bot** with scopes: `bot`, `applications.commands` and permissions: `Administrator`
4. **Set secrets**: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`
5. **Create roles** in your server matching names in `config.js`
6. **Deploy commands**: `node src/deploy-commands.js`
7. **Start bot**: `node src/index.js`
8. **Run `/setup`** in your server to configure channels

---

## 💡 Bonus Features (Suggestions)

- `/stats @user` — Fortnite in-game stats integration (via Fortnite API)
- `/leaderboard` — Top vouched players / most active members
- `/tryout create` — Organize tryout sessions with slot tracking
- `/announcement` — Rich embed announcement builder
- `/giveaway` — Timed giveaway system with reactions
- `/birthday set` — Birthday tracker with auto celebration messages
- `/clip` — Share and vote on clips with reactions
- `/schedule` — Weekly practice/scrim schedule viewer
