/**
 * /panel — Creates the ticket support panel.
 * Handles ticket creation, closing, and transcripts.
 */

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const config = require('../../config.js');
const { createTicket, closeTicket, getTicket, getUserOpenTickets, getConfig } = require('../../utils/database.js');

const ticketTypes = {
  ticket_support: { name: 'Support', emoji: '🎟', color: config.color },
  ticket_application: { name: 'Application', emoji: '📋', color: config.color },
  ticket_report: { name: 'Report', emoji: '🚨', color: 0xEF4444 },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Create the NXT ticket panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎟 NXT Esports — Support Center')
      .setDescription(
        'Need help? Select a category below to open a ticket.\n\n' +
        '🎟 **Support** — General help and questions\n' +
        '📋 **Application** — Questions about applying to NXT\n' +
        '🚨 **Report** — Report a rule violation or issue\n\n' +
        '*Do not open tickets for no reason. Abuse will result in a timeout.*'
      )
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_support').setLabel('Support').setEmoji('🎟').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_application').setLabel('Application').setEmoji('📋').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_report').setLabel('Report').setEmoji('🚨').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  // ─── Button handler ────────────────────────────────────────────────────────
  async handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'ticket_close') {
      return this.closeTicket(interaction);
    }

    const ticketType = ticketTypes[customId];
    if (!ticketType) return;

    await interaction.deferReply({ ephemeral: true });

    // Check for existing open ticket
    const openTickets = getUserOpenTickets(interaction.guildId, interaction.user.id);
    if (openTickets.length >= config.maxOpenTickets) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setDescription('❌ You already have an open ticket. Please use or close it before opening another.')
          .setColor(config.colorError)
          .setFooter({ text: config.footer })]
      });
    }

    const guild = interaction.guild;
    const categoryId = getConfig(interaction.guildId, 'ticket_category');
    const category = categoryId
      ? guild.channels.cache.get(categoryId)
      : guild.channels.cache.find(c => c.name === config.ticketCategory && c.type === ChannelType.GuildCategory);

    const staffRoles = guild.roles.cache.filter(r =>
      [config.roles.staff, config.roles.owner, config.roles.manager, config.roles.coach].includes(r.name)
    );

    const permOverwrites = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
      },
      ...staffRoles.map(r => ({
        id: r.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
      })),
    ];

    let channel;
    try {
      channel = await guild.channels.create({
        name: `${ticketType.emoji}-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`,
        type: ChannelType.GuildText,
        parent: category?.id,
        topic: `${ticketType.name} ticket | ${interaction.user.tag} | ID: ${interaction.user.id}`,
        permissionOverwrites: permOverwrites,
      });
    } catch {
      return interaction.editReply({ content: '❌ Failed to create ticket channel. Please contact a staff member directly.' });
    }

    createTicket(interaction.guildId, channel.id, interaction.user.id, ticketType.name);

    const ticketEmbed = new EmbedBuilder()
      .setTitle(`${ticketType.emoji} ${ticketType.name} Ticket`)
      .setDescription(
        `Welcome ${interaction.user}!\n\n` +
        `Please describe your issue and a staff member will be with you shortly.\n\n` +
        `**Ticket Type:** ${ticketType.name}\n` +
        `**Opened By:** ${interaction.user.tag}\n` +
        `**Opened At:** <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setColor(ticketType.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    );

    const staffMentions = staffRoles.map(r => `<@&${r.id}>`).join(' ') || '@Staff';
    await channel.send({
      content: `${interaction.user} — Staff: ${staffMentions}`,
      embeds: [ticketEmbed],
      components: [closeRow],
    });

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`✅ Your ticket has been created: ${channel}`)
        .setColor(config.colorSuccess)
        .setFooter({ text: config.footer })]
    });
  },

  // ─── Close ticket ──────────────────────────────────────────────────────────
  async closeTicket(interaction) {
    const ticket = getTicket(interaction.guildId, interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '❌ This is not a recognized ticket channel.', ephemeral: true });
    }

    const isStaff = interaction.member.roles.cache.some(r =>
      [config.roles.staff, config.roles.owner, config.roles.manager].includes(r.name)
    ) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!isStaff && ticket.userId !== interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot close this ticket.', ephemeral: true });
    }

    await interaction.deferReply();

    // Generate transcript
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const transcript = [...messages.values()].reverse()
      .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[embed/attachment]'}`)
      .join('\n');

    // Post transcript
    const transcriptChannelId = getConfig(interaction.guildId, 'transcript_channel');
    const transcriptChannel = transcriptChannelId
      ? interaction.guild.channels.cache.get(transcriptChannelId)
      : interaction.guild.channels.cache.find(c => c.name === config.channels.transcripts);

    if (transcriptChannel && transcript) {
      const transcriptEmbed = new EmbedBuilder()
        .setTitle(`📝 Ticket Transcript — #${interaction.channel.name}`)
        .setDescription(`**User:** <@${ticket.userId}>\n**Type:** ${ticket.type}\n**Closed by:** ${interaction.user.tag}`)
        .setColor(config.color)
        .setFooter({ text: config.footer })
        .setTimestamp();

      const file = Buffer.from(transcript, 'utf-8');
      await transcriptChannel.send({
        embeds: [transcriptEmbed],
        files: [{ attachment: file, name: `transcript-${interaction.channel.name}.txt` }],
      }).catch(() => {});
    }

    closeTicket(interaction.guildId, interaction.channel.id);

    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Ticket Closed')
      .setDescription(`This ticket was closed by ${interaction.user}.\nThe channel will be deleted in **5 seconds**.`)
      .setColor(config.colorError)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.editReply({ embeds: [closeEmbed] });
    await new Promise(r => setTimeout(r, 5000));
    await interaction.channel.delete().catch(() => {});
  },
};
