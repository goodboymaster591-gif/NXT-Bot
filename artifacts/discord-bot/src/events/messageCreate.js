/**
 * Anti-spam and anti-link protection.
 * Auto-detects message spam and suspicious invite/link spam.
 */

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.js');
const { getConfig, logModAction } = require('../utils/database.js');
const logger = require('../utils/logger.js');

// Regex patterns for link detection
const INVITE_REGEX = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
const SUSPICIOUS_LINK_REGEX = /https?:\/\/(?!discord\.com|discord\.gg|youtube\.com|twitch\.tv|twitter\.com|x\.com|instagram\.com|tiktok\.com)\S+/gi;

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    if (!config.antiSpam.enabled) return;

    const member = message.member;
    if (!member) return;

    // Skip mods
    if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();

    // ── Anti-invite link ─────────────────────────────────────────────────────
    if (INVITE_REGEX.test(message.content)) {
      await message.delete().catch(() => {});
      const warn = new EmbedBuilder()
        .setDescription(`⚠️ ${message.author}, posting Discord invite links is not allowed.`)
        .setColor(config.colorWarning)
        .setFooter({ text: config.footer });
      const m = await message.channel.send({ embeds: [warn] });
      setTimeout(() => m.delete().catch(() => {}), 5000);
      logModAction(guildId, 'AUTO_ANTISPAM_INVITE', userId, client.user.id, 'Posted Discord invite link');
      return;
    }

    // ── Anti-spam ─────────────────────────────────────────────────────────────
    const key = `${guildId}:${userId}`;
    const tracker = client.spamTracker;

    if (!tracker.has(key)) {
      tracker.set(key, { count: 1, firstMessage: now });
    } else {
      const data = tracker.get(key);
      const elapsed = now - data.firstMessage;

      if (elapsed < config.antiSpam.timeWindow) {
        data.count++;
        if (data.count >= config.antiSpam.maxMessages) {
          // Mute the spammer
          const duration = config.antiSpam.muteDuration * 60 * 1000;
          try {
            await member.timeout(duration, 'Auto-mod: Message spam detected');
            tracker.delete(key);

            const embed = new EmbedBuilder()
              .setDescription(`🔇 ${message.author} has been muted for **${config.antiSpam.muteDuration} minutes** for spamming.`)
              .setColor(config.colorError)
              .setFooter({ text: config.footer });

            await message.channel.send({ embeds: [embed] });
            logModAction(guildId, 'AUTO_MUTE_SPAM', userId, client.user.id, 'Auto-mod: spam detected', `${config.antiSpam.muteDuration}m`);
          } catch (err) {
            logger.warn(`Could not auto-mute ${message.author.tag}: ${err.message}`);
          }
        }
      } else {
        // Reset window
        tracker.set(key, { count: 1, firstMessage: now });
      }
    }
  },
};
