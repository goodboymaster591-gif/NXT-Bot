const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const { addPlayer, removePlayer, getPlayer } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Manage the NXT Esports roster')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a player to the roster')
        .addUserOption(opt => opt.setName('user').setDescription('Member to add').setRequired(true))
        .addStringOption(opt =>
          opt.setName('role')
            .setDescription('Their roster role')
            .setRequired(true)
            .addChoices(
              { name: 'Pro', value: 'pro' },
              { name: 'Competitive', value: 'competitive' },
              { name: 'Academy', value: 'academy' },
              { name: 'Recruit', value: 'recruit' },
              { name: 'Creator', value: 'creator' },
              { name: 'Designer', value: 'designer' },
              { name: 'Editor', value: 'editor' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a player from the roster')
        .addUserOption(opt => opt.setName('user').setDescription('Member to remove').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('user');

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    if (sub === 'add') {
      const roleKey = interaction.options.getString('role');
      addPlayer(interaction.guildId, target.id, roleKey, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ Player Added to Roster')
        .setColor(config.colorSuccess)
        .addFields(
          { name: 'Player', value: `${target}`, inline: true },
          { name: 'Role', value: config.roles[roleKey] || roleKey, inline: true },
          { name: 'Added By', value: `${interaction.user}`, inline: true },
        )
        .setFooter({ text: config.footer })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const existing = getPlayer(interaction.guildId, target.id);
      if (!existing) {
        return interaction.reply({ content: `❌ ${target.user.tag} is not on the roster.`, ephemeral: true });
      }

      removePlayer(interaction.guildId, target.id);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Player Removed from Roster')
        .setColor(config.colorWarning)
        .addFields(
          { name: 'Player', value: `${target}`, inline: true },
          { name: 'Removed By', value: `${interaction.user}`, inline: true },
        )
        .setFooter({ text: config.footer })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
