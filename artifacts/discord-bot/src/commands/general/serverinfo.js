const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display information about this server'),

  async execute(interaction) {
    const { guild } = interaction;
    await guild.fetch();

    const owner = await guild.fetchOwner();
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const roles = guild.roles.cache.size - 1;

    const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very High'];

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .setColor(config.color)
      .addFields(
        { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
        { name: '🆔 Server ID', value: guild.id, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Members', value: `${guild.memberCount.toLocaleString()}`, inline: true },
        { name: '🎭 Roles', value: `${roles}`, inline: true },
        { name: '🔐 Verification', value: verificationLevels[guild.verificationLevel] || 'Unknown', inline: true },
        { name: '💬 Channels', value: `📝 ${textChannels} Text | 🔊 ${voiceChannels} Voice`, inline: false },
        { name: '🚀 Boost Level', value: `Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (guild.description) embed.setDescription(guild.description);

    await interaction.reply({ embeds: [embed] });
  },
};
