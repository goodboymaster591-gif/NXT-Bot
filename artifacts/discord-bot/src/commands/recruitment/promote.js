const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a member to a higher role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('Member to promote').setRequired(true))
    .addStringOption(opt =>
      opt.setName('role')
        .setDescription('New role to assign')
        .setRequired(true)
        .addChoices(
          { name: 'NXT | Academy', value: 'academy' },
          { name: 'NXT | Competitive', value: 'competitive' },
          { name: 'NXT | Pro', value: 'pro' },
          { name: 'NXT | Creator', value: 'creator' },
          { name: 'NXT | Designer', value: 'designer' },
          { name: 'NXT | Editor', value: 'editor' },
          { name: 'NXT | Recruiter', value: 'recruiter' },
          { name: 'NXT | Coach', value: 'coach' },
          { name: 'NXT | Manager', value: 'manager' },
        )
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for promotion').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const roleKey = interaction.options.getString('role');
    const reason = interaction.options.getString('reason') || 'Promoted within NXT Esports';

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    const roleName = config.roles[roleKey];
    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return interaction.reply({ content: `❌ Role "${roleName}" not found.`, ephemeral: true });

    try {
      await target.roles.add(role, reason);
    } catch {
      return interaction.reply({ content: '❌ Failed to assign role.', ephemeral: true });
    }

    logModAction(interaction.guildId, 'PROMOTE', target.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('⬆️ Member Promoted')
      .setColor(config.colorSuccess)
      .addFields(
        { name: 'Member', value: `${target}`, inline: true },
        { name: 'New Role', value: role.toString(), inline: true },
        { name: 'Promoted By', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const dmEmbed = new EmbedBuilder()
      .setTitle('🎉 NXT Esports — You\'ve Been Promoted!')
      .setDescription(`Congratulations! You've been promoted to **${roleName}** in NXT Esports.\n\n**Reason:** ${reason}\n\nKeep up the great work! ⚡`)
      .setColor(config.colorSuccess)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
