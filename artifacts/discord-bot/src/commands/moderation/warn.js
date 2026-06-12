const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { addWarning, getWarningCount, logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
    if (target.id === interaction.client.user.id) return interaction.reply({ content: '❌ You cannot warn me.', ephemeral: true });

    addWarning(interaction.guildId, target.id, interaction.user.id, reason);
    const totalWarnings = getWarningCount(interaction.guildId, target.id);
    logModAction(interaction.guildId, 'WARN', target.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Member Warned')
      .setColor(config.colorWarning)
      .addFields(
        { name: 'Member', value: `${target}`, inline: true },
        { name: 'Warned By', value: `${interaction.user}`, inline: true },
        { name: 'Total Warnings', value: `${totalWarnings}`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setTitle(`⚠️ Warning Received — ${interaction.guild.name}`)
      .setDescription(`You have received a warning.\n\n**Reason:** ${reason}\n**Total Warnings:** ${totalWarnings}\n\nPlease review the server rules to avoid further action.`)
      .setColor(config.colorWarning)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
