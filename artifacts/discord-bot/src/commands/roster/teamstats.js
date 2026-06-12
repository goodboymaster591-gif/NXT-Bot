const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { getTotalPlayers, getPlayerCountByRole } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teamstats')
    .setDescription('View NXT Esports team statistics'),

  async execute(interaction) {
    const total = getTotalPlayers(interaction.guildId);
    const byRole = getPlayerCountByRole(interaction.guildId);

    const roleMap = {
      pro: { label: 'Pro Players', emoji: '👑' },
      competitive: { label: 'Competitive', emoji: '💎' },
      academy: { label: 'Academy', emoji: '⚡' },
      recruit: { label: 'Recruits', emoji: '🌟' },
      creator: { label: 'Creators', emoji: '📹' },
      designer: { label: 'Designers', emoji: '🎨' },
      editor: { label: 'Editors', emoji: '🎬' },
    };

    const embed = new EmbedBuilder()
      .setTitle('📊 NXT Esports — Team Statistics')
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (total === 0) {
      embed.setDescription('No roster data available yet. Use `/player add` to add members.');
    } else {
      embed.setDescription(`**Organization Overview** — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);

      const fields = byRole.map(r => {
        const info = roleMap[r.role] || { label: r.role, emoji: '⚡' };
        return { name: `${info.emoji} ${info.label}`, value: `\`${r.count}\``, inline: true };
      });

      if (fields.length) embed.addFields(...fields);
      embed.addFields({ name: '─────────────────', value: `**Total Members:** \`${total}\``, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
