const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { getWarnings, getWarningCount, clearWarnings } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View or manage a member\'s warnings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('View all warnings for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Member to check').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Clear all warnings for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Member to clear').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('user');

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    if (sub === 'list') {
      const warnings = getWarnings(interaction.guildId, target.id);
      const total = warnings.length;

      const embed = new EmbedBuilder()
        .setTitle(`⚠️ Warnings — ${target.user.username}`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .setColor(total > 0 ? config.colorWarning : config.colorSuccess)
        .setFooter({ text: config.footer })
        .setTimestamp();

      if (total === 0) {
        embed.setDescription('✅ This member has no warnings.');
      } else {
        embed.setDescription(`**Total: ${total} warning(s)**`);
        const list = warnings.slice(0, 10).map((w, i) =>
          `**${i + 1}.** <t:${w.created_at}:R> — by <@${w.moderator_id}>\n> ${w.reason}`
        ).join('\n\n');
        embed.addFields({ name: 'Warning History', value: list });
        if (total > 10) embed.addFields({ name: '\u200b', value: `*...and ${total - 10} more*` });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'clear') {
      const count = getWarningCount(interaction.guildId, target.id);
      if (count === 0) {
        return interaction.reply({ content: `✅ ${target.user.tag} has no warnings to clear.`, ephemeral: true });
      }

      clearWarnings(interaction.guildId, target.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ Warnings Cleared')
        .setDescription(`All **${count}** warning(s) for ${target} have been cleared.`)
        .setColor(config.colorSuccess)
        .addFields({ name: 'Cleared By', value: interaction.user.tag, inline: true })
        .setFooter({ text: config.footer })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
