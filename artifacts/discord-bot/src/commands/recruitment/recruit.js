const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recruit')
    .setDescription('Post a recruitment announcement for NXT Esports'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚡ NXT Esports is Recruiting!')
      .setDescription(
        '## 🎮 We are looking for talented individuals!\n\n' +
        '**NXT Esports** is actively recruiting players, creators, and creative staff to grow our organization.\n\n' +
        '**Open Positions:**\n' +
        '💎 Competitive Players (Contender+)\n' +
        '📹 Content Creators (500+ followers)\n' +
        '🎨 Graphic Designers (portfolio required)\n' +
        '🎬 Video Editors (portfolio required)\n\n' +
        '**What We Offer:**\n' +
        '✅ Structured team environment\n' +
        '✅ Professional coaching\n' +
        '✅ Regular scrims & tournaments\n' +
        '✅ Brand exposure & growth\n' +
        '✅ Dedicated community\n\n' +
        'Use `/apply` to submit your application!'
      )
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
