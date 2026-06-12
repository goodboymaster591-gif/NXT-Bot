/**
 * /event create — Creates a tournament event.
 * /event end — Ends the active event.
 * /event results — Posts tournament results with leaderboard.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');
const {
  createEvent, setEventMessage, endEvent, getActiveEvent, addEventResult, getEventResults,
} = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage NXT Esports tournaments and events')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a tournament event announcement')
        .addStringOption(opt => opt.setName('name').setDescription('Event name').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Event details').setRequired(true))
        .addStringOption(opt => opt.setName('prize').setDescription('Prize pool (e.g. $50 + exclusive role)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('End the active event')
    )
    .addSubcommand(sub =>
      sub.setName('results')
        .setDescription('Post event results / leaderboard')
        .addIntegerOption(opt => opt.setName('event_id').setDescription('Event ID (from /event create output)').setRequired(true))
        .addStringOption(opt => opt.setName('first').setDescription('1st place (team/player name)').setRequired(true))
        .addStringOption(opt => opt.setName('second').setDescription('2nd place').setRequired(false))
        .addStringOption(opt => opt.setName('third').setDescription('3rd place').setRequired(false))
        .addStringOption(opt => opt.setName('scores').setDescription('Score info (e.g. "1st: 42pts, 2nd: 38pts")').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── Create event ──
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const prize = interaction.options.getString('prize') || 'TBD';

      const eventId = createEvent(interaction.guildId, name, description, prize, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle(`🏆 NXT Esports — ${name}`)
        .setDescription(description)
        .setColor(config.color)
        .addFields(
          { name: '🥇 Prize Pool', value: prize, inline: true },
          { name: '📋 Event ID', value: `#${eventId}`, inline: true },
          { name: '📅 Status', value: '🟢 Open', inline: true },
          { name: '🎮 Game', value: config.game, inline: true },
          { name: '👤 Organized by', value: interaction.user.tag, inline: true },
        )
        .setFooter({ text: config.footer })
        .setTimestamp();

      const message = await interaction.reply({ embeds: [embed], fetchReply: true });
      setEventMessage(interaction.guildId, eventId, message.id, interaction.channel.id);
      return;
    }

    // ── End event ──
    if (sub === 'end') {
      const event = getActiveEvent(interaction.guildId);
      if (!event) return interaction.reply({ content: '❌ No active event found.', ephemeral: true });

      endEvent(interaction.guildId, event.id);

      const embed = new EmbedBuilder()
        .setTitle(`🏁 Event Ended — ${event.name}`)
        .setDescription(`Event **#${event.id}** has been concluded. Use \`/event results\` to post final standings.`)
        .setColor(config.colorWarning)
        .setFooter({ text: config.footer })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ── Post results ──
    if (sub === 'results') {
      const eventId = interaction.options.getInteger('event_id');
      const first = interaction.options.getString('first');
      const second = interaction.options.getString('second');
      const third = interaction.options.getString('third');
      const scores = interaction.options.getString('scores');

      if (first) addEventResult(interaction.guildId, eventId, 1, first, null);
      if (second) addEventResult(interaction.guildId, eventId, 2, second, null);
      if (third) addEventResult(interaction.guildId, eventId, 3, third, null);

      const medalMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const results = getEventResults(interaction.guildId, eventId);

      const embed = new EmbedBuilder()
        .setTitle(`🏆 Tournament Results — Event #${eventId}`)
        .setDescription('The event has concluded! Here are the final standings:')
        .setColor(config.color)
        .setFooter({ text: config.footer })
        .setTimestamp();

      for (const r of results) {
        embed.addFields({ name: `${medalMap[r.place] || `#${r.place}`} ${r.team}`, value: r.score || '\u200b', inline: false });
      }

      if (scores) embed.addFields({ name: '📊 Score Summary', value: scores, inline: false });

      await interaction.reply({ embeds: [embed] });
    }
  },
};
