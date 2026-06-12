const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('requirements')
    .setDescription('View NXT Esports roster requirements'),

  async execute(interaction) {
    const { requirements } = config;

    const embed = new EmbedBuilder()
      .setTitle('📋 NXT Esports — Roster Requirements')
      .setDescription('Want to join NXT? Here\'s what we look for in each role:')
      .setColor(config.color)
      .addFields(
        {
          name: '💎 Competitive Player',
          value: requirements.competitive.map(r => `• ${r}`).join('\n'),
          inline: false,
        },
        {
          name: '📹 Content Creator',
          value: requirements.creator.map(r => `• ${r}`).join('\n'),
          inline: false,
        },
        {
          name: '🎨 Designer',
          value: requirements.designer.map(r => `• ${r}`).join('\n'),
          inline: false,
        },
        {
          name: '🎬 Editor',
          value: requirements.editor.map(r => `• ${r}`).join('\n'),
          inline: false,
        },
        {
          name: '📝 Ready to Apply?',
          value: 'Use `/apply` to open the application panel and start your journey with NXT!',
          inline: false,
        },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
