/**
 * Logs edited messages.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const { getConfig } = require('../utils/database.js');

module.exports = {
  name: 'messageUpdate',

  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const logChannelId = getConfig(newMessage.guild.id, 'log_channel');
    const logChannel = logChannelId
      ? newMessage.guild.channels.cache.get(logChannelId)
      : newMessage.guild.channels.cache.find(c => c.name === config.channels.logs);

    if (!logChannel) return;

    const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '...' : str || '*empty*';

    const embed = new EmbedBuilder()
      .setTitle('✏️ Message Edited')
      .setColor(config.colorWarning)
      .addFields(
        { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
        { name: 'Channel', value: `${newMessage.channel}`, inline: true },
        { name: '📋 Jump to Message', value: `[Click here](${newMessage.url})`, inline: true },
        { name: 'Before', value: truncate(oldMessage.content, 512), inline: false },
        { name: 'After', value: truncate(newMessage.content, 512), inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
