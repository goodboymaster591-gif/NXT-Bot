const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { getAllPlayers, getPlayerCountByRole, getTotalPlayers } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('View the full NXT Esports roster'),

  async execute(interaction) {
    await interaction.deferReply();

    const players = getAllPlayers(interaction.guildId);
    const total = getTotalPlayers(interaction.guildId);
    const countByRole = getPlayerCountByRole(interaction.guildId);

    const roleEmojis = {
      pro: '👑', competitive: '💎', academy: '⚡', recruit: '🌟',
      creator: '📹', designer: '🎨', editor: '🎬', staff: '🛡️',
    };

    const embed = new EmbedBuilder()
      .setTitle('📊 NXT Esports — Official Roster')
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (players.length === 0) {
      embed.setDescription('No players have been added to the roster yet.\nUse `/player add` to add members.');
    } else {
      // Group players by role
      const grouped = {};
      for (const p of players) {
        if (!grouped[p.role]) grouped[p.role] = [];
        grouped[p.role].push(p);
      }

      for (const [role, members] of Object.entries(grouped)) {
        const emoji = roleEmojis[role.toLowerCase()] || '⚡';
        const roleName = config.roles[role.toLowerCase()] || role;
        const list = members.map(m => `<@${m.user_id}>`).join(', ');
        embed.addFields({ name: `${emoji} ${roleName} (${members.length})`, value: list, inline: false });
      }

      embed.setDescription(`**Total Roster Size:** ${total} member${total !== 1 ? 's' : ''}`);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
