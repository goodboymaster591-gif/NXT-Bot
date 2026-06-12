/**
 * Auto welcome messages + auto role assignment.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const { getConfig } = require('../utils/database.js');
const logger = require('../utils/logger.js');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    const guild = member.guild;
    logger.event(`Member joined: ${member.user.tag} in ${guild.name}`);

    // ── Auto-assign member role ───────────────────────────────────────────────
    const memberRole = guild.roles.cache.find(r => r.name === config.roles.member);
    if (memberRole) {
      await member.roles.add(memberRole).catch(() => {});
    }

    // ── Welcome message ───────────────────────────────────────────────────────
    const welcomeChannelId = getConfig(guild.id, 'welcome_channel');
    const welcomeChannel = welcomeChannelId
      ? guild.channels.cache.get(welcomeChannelId)
      : guild.channels.cache.find(c => c.name === config.channels.welcome);

    if (!welcomeChannel) return;

    const memberCount = guild.memberCount;

    const embed = new EmbedBuilder()
      .setTitle('⚡ Welcome to NXT Esports!')
      .setDescription(
        `Hey ${member}, welcome to **${guild.name}**!\n\n` +
        `You are our **${memberCount.toLocaleString()}${getOrdinal(memberCount)}** member!\n\n` +
        `📋 Check out the rules with \`/rules\`\n` +
        `📝 Want to join NXT? Use \`/apply\`\n` +
        `🎮 View roster requirements with \`/requirements\`\n\n` +
        `Good luck on your journey — NEXT UP! ⚡`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await welcomeChannel.send({ content: `Welcome ${member}!`, embeds: [embed] }).catch(() => {});

    // ── Log to logs channel ───────────────────────────────────────────────────
    await logEvent(guild, new EmbedBuilder()
      .setTitle('📥 Member Joined')
      .setDescription(`${member} (${member.user.tag})`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(config.colorSuccess)
      .addFields(
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Member Count', value: `${memberCount}`, inline: true },
        { name: 'User ID', value: member.id, inline: true },
      )
      .setFooter({ text: config.footer })
      .setTimestamp()
    );
  },
};

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

async function logEvent(guild, embed) {
  const { getConfig } = require('../utils/database.js');
  const logChannelId = getConfig(guild.id, 'log_channel');
  const logChannel = logChannelId
    ? guild.channels.cache.get(logChannelId)
    : guild.channels.cache.find(c => c.name === config.channels.logs);
  if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
}
