const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Display the NXT Esports server rules'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📜 NXT Esports — Server Rules')
      .setDescription(config.rules.join('\n\n'))
      .setColor(config.color)
      .addFields({ name: '\u200b', value: '*Breaking these rules may result in a warning, mute, kick, or ban depending on severity.*' })
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
