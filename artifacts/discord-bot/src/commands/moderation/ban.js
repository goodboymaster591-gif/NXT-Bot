const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || await interaction.guild.members.fetch(interaction.options.getUser('user')?.id).catch(() => null);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot ban yourself.', ephemeral: true });

    const dmEmbed = new EmbedBuilder()
      .setTitle(`🔨 You Have Been Banned — ${interaction.guild.name}`)
      .setDescription(`**Reason:** ${reason}\n\nIf you believe this is a mistake, please contact the server administration.`)
      .setColor(config.colorError)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send?.({ embeds: [dmEmbed] }).catch(() => {});

    try {
      await interaction.guild.members.ban(target.id || target.user.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageDays: deleteDays,
      });
    } catch {
      return interaction.reply({ content: '❌ Failed to ban this member. Check permissions.', ephemeral: true });
    }

    logModAction(interaction.guildId, 'BAN', target.id || target.user?.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('🔨 Member Banned')
      .setColor(config.colorError)
      .addFields(
        { name: 'Member', value: target.user?.tag || target.tag || 'Unknown', inline: true },
        { name: 'Banned By', value: `${interaction.user}`, inline: true },
        { name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
