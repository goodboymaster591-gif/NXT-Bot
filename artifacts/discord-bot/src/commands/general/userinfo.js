const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display information about a user')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to look up (defaults to you)').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const user = target.user;
    await user.fetch(true).catch(() => {});

    const roles = target.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(target.displayHexColor !== '#000000' ? target.displayHexColor : config.color)
      .addFields(
        { name: '🏷 Display Name', value: target.displayName, inline: true },
        { name: '🆔 User ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '📥 Joined Server', value: target.joinedTimestamp ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        { name: '⚡ Booster', value: target.premiumSince ? `Since <t:${Math.floor(target.premiumSinceTimestamp / 1000)}:R>` : 'No', inline: true },
        { name: `🎭 Roles [${roles.length}]`, value: roles.length ? roles.join(', ') : 'No roles', inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
