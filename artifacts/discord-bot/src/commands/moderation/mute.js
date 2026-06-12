const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { logModAction } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Member to mute').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320) // 28 days
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: '❌ I cannot mute this member.', ephemeral: true });

    const ms = duration * 60 * 1000;
    const until = new Date(Date.now() + ms);

    try {
      await target.timeout(ms, `${interaction.user.tag}: ${reason}`);
    } catch {
      return interaction.reply({ content: '❌ Failed to mute this member.', ephemeral: true });
    }

    const durationLabel = duration >= 60
      ? `${Math.floor(duration / 60)}h ${duration % 60}m`
      : `${duration}m`;

    logModAction(interaction.guildId, 'MUTE', target.id, interaction.user.id, reason, durationLabel);

    const embed = new EmbedBuilder()
      .setTitle('🔇 Member Muted')
      .setColor(config.colorWarning)
      .addFields(
        { name: 'Member', value: `${target}`, inline: true },
        { name: 'Muted By', value: `${interaction.user}`, inline: true },
        { name: 'Duration', value: durationLabel, inline: true },
        { name: 'Expires', value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const dmEmbed = new EmbedBuilder()
      .setTitle(`🔇 You Have Been Muted — ${interaction.guild.name}`)
      .setDescription(`**Duration:** ${durationLabel}\n**Reason:** ${reason}\n**Expires:** <t:${Math.floor(until.getTime() / 1000)}:R>`)
      .setColor(config.colorWarning)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
