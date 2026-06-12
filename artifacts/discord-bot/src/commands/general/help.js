const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

const categories = [
  {
    name: '📋 General',
    value: '`/help` `/ping` `/serverinfo` `/userinfo` `/avatar` `/socials` `/rules` `/requirements`',
  },
  {
    name: '📝 Applications',
    value: '`/apply` — Opens the application panel (Competitive, Creator, Designer, Editor)',
  },
  {
    name: '🎟 Tickets',
    value: '`/panel` — Creates the ticket panel (Support, Applications, Reports)',
  },
  {
    name: '⚔️ Recruitment',
    value: '`/recruit` `/accept` `/deny` `/promote` `/demote`',
  },
  {
    name: '📊 Roster',
    value: '`/roster` `/player add` `/player remove` `/teamstats`',
  },
  {
    name: '🏆 Scrims',
    value: '`/scrim create` `/scrim attendance`',
  },
  {
    name: '🎮 Events',
    value: '`/event create` `/event end` `/event results`',
  },
  {
    name: '✅ Vouches',
    value: '`/vouch` `/vouches`',
  },
  {
    name: '🔨 Moderation',
    value: '`/warn` `/mute` `/kick` `/ban` `/purge` `/warnings`',
  },
  {
    name: '⚙️ Setup',
    value: '`/setup` — Interactive server configuration wizard',
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all NXT bot commands and categories'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚡ NXT Esports Bot — Command List')
      .setDescription('All available commands organized by category. Use slash commands to interact.')
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    for (const cat of categories) {
      embed.addFields({ name: cat.name, value: cat.value });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
