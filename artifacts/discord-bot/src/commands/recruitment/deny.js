const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deny')
    .setDescription('Deny a member\'s application to NXT Esports')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('Member to deny').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for denial').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'Does not meet current requirements';

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    logModAction(interaction.guildId, 'DENY', target.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('❌ Application Denied')
      .setDescription(`${target}'s application has been denied.`)
      .setColor(config.colorError)
      .addFields(
        { name: 'Member', value: target.user.tag, inline: true },
        { name: 'Denied By', value: interaction.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // DM user
    const dmEmbed = new EmbedBuilder()
      .setTitle('NXT Esports — Application Update')
      .setDescription(
        `We appreciate your interest in **NXT Esports**.\n\nAfter reviewing your application, we've decided not to move forward at this time.\n\n**Reason:** ${reason}\n\nWe encourage you to continue improving and apply again in the future! ⚡`
      )
      .setColor(config.colorError)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
