const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '⏳ Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = createEmbed(
      '🏓 Pong!',
      `**Bot Latency:** \`${latency}ms\`\n**API Latency:** \`${apiLatency}ms\`\n**Status:** ${latency < 200 ? '🟢 Excellent' : latency < 500 ? '🟡 Good' : '🔴 High'}`
    );

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
