const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { addVouch, getVouchCount, hasVouched } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Vouch for a member of NXT Esports')
    .addUserOption(opt => opt.setName('user').setDescription('Member to vouch for').setRequired(true))
    .addStringOption(opt => opt.setName('comment').setDescription('Leave a comment about this person').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const comment = interaction.options.getString('comment') || null;

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot vouch for yourself.', ephemeral: true });
    }

    if (hasVouched(interaction.guildId, target.id, interaction.user.id)) {
      return interaction.reply({ content: `❌ You've already vouched for ${target.user.tag}.`, ephemeral: true });
    }

    addVouch(interaction.guildId, target.id, interaction.user.id, comment);
    const total = getVouchCount(interaction.guildId, target.id);

    const embed = new EmbedBuilder()
      .setTitle('✅ Vouch Recorded')
      .setColor(config.colorSuccess)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Vouched For', value: `${target}`, inline: true },
        { name: 'Vouched By', value: `${interaction.user}`, inline: true },
        { name: 'Total Vouches', value: `${total}`, inline: true },
      )
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (comment) embed.addFields({ name: '💬 Comment', value: comment, inline: false });

    await interaction.reply({ embeds: [embed] });
  },
};
