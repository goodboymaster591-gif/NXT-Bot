const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Display a user\'s avatar')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user (defaults to you)').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const avatarUrl = target.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${target.username}'s Avatar`)
      .setImage(avatarUrl)
      .setColor(config.color)
      .addFields(
        { name: 'Download Links', value: `[PNG](${target.displayAvatarURL({ format: 'png', size: 1024 })}) • [JPG](${target.displayAvatarURL({ format: 'jpg', size: 1024 })}) • [WEBP](${target.displayAvatarURL({ format: 'webp', size: 1024 })})` }
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
