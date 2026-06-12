const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Only delete messages from this user (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    let messages = await interaction.channel.messages.fetch({ limit: 100 });

    // Filter to messages newer than 14 days (Discord limitation)
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

    if (filterUser) {
      messages = messages.filter(m => m.author.id === filterUser.id);
    }

    messages = messages.first(amount);

    if (messages.length === 0) {
      return interaction.editReply({ content: '❌ No eligible messages found (messages older than 14 days cannot be deleted).' });
    }

    let deleted = 0;
    try {
      const result = await interaction.channel.bulkDelete(messages, true);
      deleted = result.size;
    } catch {
      return interaction.editReply({ content: '❌ Failed to delete messages.' });
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Messages Purged')
      .setColor(config.colorSuccess)
      .addFields(
        { name: 'Deleted', value: `${deleted} message(s)`, inline: true },
        { name: 'Channel', value: `${interaction.channel}`, inline: true },
        { name: 'By', value: `${interaction.user}`, inline: true },
        filterUser ? { name: 'Filter', value: filterUser.tag, inline: true } : null,
      ).filter(Boolean)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
