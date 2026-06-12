const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction, getConfig } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Accept a member into NXT Esports')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('Member to accept').setRequired(true))
    .addStringOption(opt =>
      opt.setName('role')
        .setDescription('Role to assign')
        .setRequired(true)
        .addChoices(
          { name: 'NXT | Recruit', value: 'recruit' },
          { name: 'NXT | Academy', value: 'academy' },
          { name: 'NXT | Competitive', value: 'competitive' },
          { name: 'NXT | Pro', value: 'pro' },
          { name: 'NXT | Creator', value: 'creator' },
          { name: 'NXT | Designer', value: 'designer' },
          { name: 'NXT | Editor', value: 'editor' },
        )
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Acceptance reason').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const roleKey = interaction.options.getString('role');
    const reason = interaction.options.getString('reason') || 'Accepted into NXT Esports';

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    const roleName = config.roles[roleKey];
    const discordRole = interaction.guild.roles.cache.find(r => r.name === roleName);

    if (!discordRole) {
      return interaction.reply({
        content: `❌ Role "${roleName}" not found. Make sure roles are set up correctly in your server.`,
        ephemeral: true,
      });
    }

    try {
      await target.roles.add(discordRole, `Accepted by ${interaction.user.tag}: ${reason}`);
    } catch {
      return interaction.reply({ content: '❌ Failed to assign role. Check bot permissions.', ephemeral: true });
    }

    logModAction(interaction.guildId, 'ACCEPT', target.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('✅ Member Accepted')
      .setDescription(`${target} has been accepted into **NXT Esports**!`)
      .setColor(config.colorSuccess)
      .addFields(
        { name: 'Member', value: `${target.user.tag}`, inline: true },
        { name: 'Role Assigned', value: discordRole.toString(), inline: true },
        { name: 'Accepted By', value: interaction.user.toString(), inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setTitle('🎉 Welcome to NXT Esports!')
      .setDescription(
        `Congratulations! You have been accepted into **NXT Esports**.\n\n` +
        `**Role:** ${roleName}\n` +
        `**Reason:** ${reason}\n\n` +
        `Welcome to the family! ⚡`
      )
      .setColor(config.colorSuccess)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
