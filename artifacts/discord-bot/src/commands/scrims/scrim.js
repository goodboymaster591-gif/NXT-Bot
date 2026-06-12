/**
 * /scrim create — Creates a scrim announcement with attendance buttons.
 * /scrim attendance — Shows attendance list for the active scrim.
 */

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const config = require('../../config.js');
const {
  createScrim, setScrimMessage, getActiveScrim, getAttendance, setAttendance,
} = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Manage NXT scrims')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new scrim announcement')
        .addStringOption(opt => opt.setName('date').setDescription('Date (e.g. Jan 15)').setRequired(true))
        .addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 8:00 PM EST)').setRequired(true))
        .addStringOption(opt =>
          opt.setName('region')
            .setDescription('Region')
            .setRequired(true)
            .addChoices(
              { name: 'NAE', value: 'NAE' },
              { name: 'NAW', value: 'NAW' },
              { name: 'EU', value: 'EU' },
              { name: 'OCE', value: 'OCE' },
              { name: 'BR', value: 'BR' },
            )
        )
        .addStringOption(opt =>
          opt.setName('team_size')
            .setDescription('Team format')
            .setRequired(true)
            .addChoices(
              { name: 'Solos', value: 'Solos' },
              { name: 'Duos', value: 'Duos' },
              { name: 'Trios', value: 'Trios' },
              { name: 'Squads', value: 'Squads' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('attendance')
        .setDescription('Show attendance for the current scrim')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const date = interaction.options.getString('date');
      const time = interaction.options.getString('time');
      const region = interaction.options.getString('region');
      const teamSize = interaction.options.getString('team_size');

      const scrimId = createScrim(interaction.guildId, date, time, region, teamSize, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('⚔️ NXT Esports — Scrim Announcement')
        .setDescription('A new scrim has been scheduled! React below to confirm your attendance.')
        .setColor(config.color)
        .addFields(
          { name: '📅 Date', value: date, inline: true },
          { name: '⏰ Time', value: time, inline: true },
          { name: '🌍 Region', value: region, inline: true },
          { name: '👥 Format', value: teamSize, inline: true },
          { name: '📋 Scrim ID', value: `#${scrimId}`, inline: true },
          { name: '✅ Attending', value: 'No one yet', inline: false },
          { name: '❌ Not Attending', value: 'No one yet', inline: false },
        )
        .setFooter({ text: config.footer })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`scrim_attend_${scrimId}`).setLabel('Attending').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`scrim_absent_${scrimId}`).setLabel('Not Attending').setEmoji('❌').setStyle(ButtonStyle.Danger),
      );

      const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
      setScrimMessage(interaction.guildId, scrimId, message.id, interaction.channel.id);
    }

    if (sub === 'attendance') {
      const scrim = getActiveScrim(interaction.guildId);
      if (!scrim) {
        return interaction.reply({ content: '❌ No active scrim found.', ephemeral: true });
      }

      const attending = getAttendance(interaction.guildId, scrim.id, 'attending');
      const absent = getAttendance(interaction.guildId, scrim.id, 'absent');

      const embed = new EmbedBuilder()
        .setTitle(`📋 Scrim #${scrim.id} — Attendance`)
        .setColor(config.color)
        .addFields(
          { name: '📅 Date', value: scrim.date, inline: true },
          { name: '⏰ Time', value: scrim.time, inline: true },
          { name: '🌍 Region', value: scrim.region, inline: true },
          {
            name: `✅ Attending (${attending.length})`,
            value: attending.length ? attending.map(a => `<@${a.user_id}>`).join(', ') : 'None',
            inline: false,
          },
          {
            name: `❌ Not Attending (${absent.length})`,
            value: absent.length ? absent.map(a => `<@${a.user_id}>`).join(', ') : 'None',
            inline: false,
          },
        )
        .setFooter({ text: config.footer })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  // ─── Button handler for attendance ─────────────────────────────────────────
  async handleButton(interaction) {
    const parts = interaction.customId.split('_');
    const action = parts[1]; // 'attend' or 'absent'
    const scrimId = parseInt(parts[2], 10);

    if (!scrimId) return;

    const status = action === 'attend' ? 'attending' : 'absent';
    setAttendance(interaction.guildId, scrimId, interaction.user.id, status);

    // Refresh attendance counts for the embed
    const attending = getAttendance(interaction.guildId, scrimId, 'attending');
    const absent = getAttendance(interaction.guildId, scrimId, 'absent');

    const oldEmbed = interaction.message.embeds[0];
    const embed = EmbedBuilder.from(oldEmbed)
      .spliceFields(5, 2,
        {
          name: `✅ Attending (${attending.length})`,
          value: attending.length ? attending.map(a => `<@${a.user_id}>`).join(', ') : 'No one yet',
          inline: false,
        },
        {
          name: `❌ Not Attending (${absent.length})`,
          value: absent.length ? absent.map(a => `<@${a.user_id}>`).join(', ') : 'No one yet',
          inline: false,
        },
      );

    await interaction.update({ embeds: [embed], components: interaction.message.components });
  },
};
