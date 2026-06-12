/**
 * Logs when members leave the server.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const { getConfig } = require('../utils/database.js');
const logger = require('../utils/logger.js');

module.exports = {
  name: 'guildMemberRemove',

  async execute(member, client) {
    const guild = member.guild;
    logger.event(`Member left: ${member.user.tag} from ${guild.name}`);

    const logChannelId = getConfig(guild.id, 'log_channel');
    const logChannel = logChannelId
      ? guild.channels.cache.get(logChannelId)
      : guild.channels.cache.find(c => c.name === config.channels.logs);

    if (!logChannel) return;

    const roles = member.roles.cache
      .filter(r => r.id !== guild.roles.everyone.id)
      .map(r => r.toString())
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setTitle('📤 Member Left')
      .setDescription(`${member.user.tag} has left the server.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(config.colorError)
      .addFields(
        { name: 'User ID', value: member.id, inline: true },
        { name: 'Joined', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Roles', value: roles.length > 1024 ? roles.slice(0, 1021) + '...' : roles, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
