const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: '❌ I cannot kick this member.', ephemeral: true });

    const dmEmbed = new EmbedBuilder()
      .setTitle(`👢 You Have Been Kicked — ${interaction.guild.name}`)
      .setDescription(`**Reason:** ${reason}\n\nYou may rejoin using an invite link.`)
      .setColor(config.colorError)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});

    try {
      await target.kick(`${interaction.user.tag}: ${reason}`);
    } catch {
      return interaction.reply({ content: '❌ Failed to kick this member.', ephemeral: true });
    }

    logModAction(interaction.guildId, 'KICK', target.user.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('👢 Member Kicked')
      .setColor(config.colorError)
      .addFields(
        { name: 'Member', value: target.user.tag, inline: true },
        { name: 'Kicked By', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
