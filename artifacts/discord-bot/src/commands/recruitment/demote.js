const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Demote a member by removing a role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('Member to demote').setRequired(true))
    .addStringOption(opt =>
      opt.setName('role')
        .setDescription('Role to remove')
        .setRequired(true)
        .addChoices(
          { name: 'NXT | Pro', value: 'pro' },
          { name: 'NXT | Competitive', value: 'competitive' },
          { name: 'NXT | Academy', value: 'academy' },
          { name: 'NXT | Creator', value: 'creator' },
          { name: 'NXT | Designer', value: 'designer' },
          { name: 'NXT | Editor', value: 'editor' },
          { name: 'NXT | Recruiter', value: 'recruiter' },
          { name: 'NXT | Coach', value: 'coach' },
        )
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for demotion').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const roleKey = interaction.options.getString('role');
    const reason = interaction.options.getString('reason') || 'Demoted within NXT Esports';

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    const roleName = config.roles[roleKey];
    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return interaction.reply({ content: `❌ Role "${roleName}" not found.`, ephemeral: true });

    if (!target.roles.cache.has(role.id)) {
      return interaction.reply({ content: `❌ ${target.user.tag} does not have the **${roleName}** role.`, ephemeral: true });
    }

    try {
      await target.roles.remove(role, reason);
    } catch {
      return interaction.reply({ content: '❌ Failed to remove role.', ephemeral: true });
    }

    logModAction(interaction.guildId, 'DEMOTE', target.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('⬇️ Member Demoted')
      .setColor(config.colorWarning)
      .addFields(
        { name: 'Member', value: `${target}`, inline: true },
        { name: 'Role Removed', value: role.toString(), inline: true },
        { name: 'Demoted By', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
