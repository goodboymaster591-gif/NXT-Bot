const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { getVouches, getVouchCount } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouches')
    .setDescription('View vouches for a member')
    .addUserOption(opt => opt.setName('user').setDescription('Member to look up (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const vouches = getVouches(interaction.guildId, target.id);
    const total = getVouchCount(interaction.guildId, target.id);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Vouches — ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (total === 0) {
      embed.setDescription('This member has no vouches yet.');
    } else {
      embed.setDescription(`**Total Vouches: ${total}**`);
      const recent = vouches.slice(0, 10);
      const list = recent.map(v =>
        `<@${v.author_id}>${v.comment ? ` — *"${v.comment}"*` : ''} • <t:${v.created_at}:R>`
      ).join('\n');
      embed.addFields({ name: '📋 Recent Vouches', value: list });
      if (vouches.length > 10) {
        embed.addFields({ name: '\u200b', value: `*...and ${vouches.length - 10} more*` });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
