/**
 * Logs deleted messages.
 */

const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config.js');
const { getConfig } = require('../utils/database.js');

module.exports = {
  name: 'messageDelete',

  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;

    const logChannelId = getConfig(message.guild.id, 'log_channel');
    const logChannel = logChannelId
      ? message.guild.channels.cache.get(logChannelId)
      : message.guild.channels.cache.find(c => c.name === config.channels.logs);

    if (!logChannel || message.channel.id === logChannel.id) return;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message Deleted')
      .setColor(config.colorError)
      .addFields(
        { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Content', value: message.content ? (message.content.length > 1020 ? message.content.slice(0, 1020) + '...' : message.content) : '*No text content*', inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (message.attachments.size > 0) {
      embed.addFields({ name: 'Attachments', value: `${message.attachments.size} file(s)`, inline: true });
    }

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
