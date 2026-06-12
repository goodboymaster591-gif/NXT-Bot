/**
 * Logs role and nickname changes.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const { getConfig } = require('../utils/database.js');

module.exports = {
  name: 'guildMemberUpdate',

  async execute(oldMember, newMember, client) {
    if (!newMember.guild) return;

    const logChannelId = getConfig(newMember.guild.id, 'log_channel');
    const logChannel = logChannelId
      ? newMember.guild.channels.cache.get(logChannelId)
      : newMember.guild.channels.cache.find(c => c.name === config.channels.logs);

    if (!logChannel) return;

    // ── Nickname change ───────────────────────────────────────────────────────
    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setTitle('📝 Nickname Changed')
        .setColor(config.colorInfo)
        .addFields(
          { name: 'Member', value: `${newMember.user.tag}`, inline: true },
          { name: 'Before', value: oldMember.nickname || '*None*', inline: true },
          { name: 'After', value: newMember.nickname || '*None*', inline: true },
        )
        .setFooter({ text: config.footer })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // ── Role changes ──────────────────────────────────────────────────────────
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setTitle('🎭 Roles Updated')
        .setColor(config.colorInfo)
        .addFields({ name: 'Member', value: `${newMember.user.tag} (${newMember.id})`, inline: false })
        .setFooter({ text: config.footer })
        .setTimestamp();

      if (addedRoles.size > 0) {
        embed.addFields({ name: '✅ Roles Added', value: addedRoles.map(r => r.toString()).join(', '), inline: false });
      }
      if (removedRoles.size > 0) {
        embed.addFields({ name: '❌ Roles Removed', value: removedRoles.map(r => r.toString()).join(', '), inline: false });
      }

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
