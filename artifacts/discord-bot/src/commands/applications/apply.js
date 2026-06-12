/**
 * /apply — Multi-step professional application flow.
 *
 * Competitive flow: Type → Region (buttons) → Platform (buttons) → Modal
 * Other types:      Type → Modal directly
 *
 * Inactivity policy: Members removed after 48hrs unless staff-approved inactive.
 */

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const config = require('../../config.js');
const { saveApplication, getConfig } = require('../../utils/database.js');

// ─── Region & platform options ────────────────────────────────────────────────

const REGIONS = [
  { id: 'NAE', label: 'NA East',      emoji: '🇺🇸' },
  { id: 'NAC', label: 'NA Central',   emoji: '🇺🇸' },
  { id: 'NAW', label: 'NA West',      emoji: '🇺🇸' },
  { id: 'EU',  label: 'Europe',       emoji: '🇪🇺' },
  { id: 'OCE', label: 'Oceania',      emoji: '🇦🇺' },
  { id: 'BR',  label: 'Brazil',       emoji: '🇧🇷' },
  { id: 'ME',  label: 'Middle East',  emoji: '🌍' },
];

const PLATFORMS = [
  { id: 'PC',      label: 'PC / Mouse & Keyboard', emoji: '🖱️' },
  { id: 'Console', label: 'Console / Controller',  emoji: '🎮' },
  { id: 'Mobile',  label: 'Mobile',                emoji: '📱' },
];

// ─── Non-competitive modal questions ─────────────────────────────────────────

const OTHER_QUESTIONS = {
  creator: [
    { id: 'platform',     label: 'What platforms do you post on?',            placeholder: 'e.g. YouTube, TikTok, Twitch',    style: TextInputStyle.Short },
    { id: 'links',        label: 'Share your social media links',             placeholder: 'YouTube: / TikTok: / Twitch:',    style: TextInputStyle.Paragraph },
    { id: 'followers',    label: 'Current follower / subscriber counts?',     placeholder: 'Platform: Count',                  style: TextInputStyle.Short },
    { id: 'content',      label: 'Content style and posting schedule?',       placeholder: 'What do you make and how often?', style: TextInputStyle.Paragraph },
    { id: 'whynxt',       label: 'Why do you want to create for NXT?',        placeholder: 'Your goals and what you bring',   style: TextInputStyle.Paragraph },
  ],
  designer: [
    { id: 'software',     label: 'What design software do you use?',          placeholder: 'e.g. Photoshop, Figma',           style: TextInputStyle.Short },
    { id: 'portfolio',    label: 'Share your portfolio link',                 placeholder: 'Portfolio URL or Behance',         style: TextInputStyle.Short },
    { id: 'experience',   label: 'How long have you been designing?',         placeholder: 'Years + background',               style: TextInputStyle.Short },
    { id: 'services',     label: 'What can you design? (logos, thumbs, etc)', placeholder: 'List your capabilities',           style: TextInputStyle.Paragraph },
    { id: 'whynxt',       label: 'Why do you want to design for NXT?',        placeholder: 'Your motivation',                  style: TextInputStyle.Paragraph },
  ],
  editor: [
    { id: 'software',     label: 'What editing software do you use?',         placeholder: 'e.g. Premiere Pro, DaVinci',      style: TextInputStyle.Short },
    { id: 'portfolio',    label: 'Portfolio link or sample video',            placeholder: 'YouTube / Drive link',             style: TextInputStyle.Short },
    { id: 'experience',   label: 'How long have you been video editing?',     placeholder: 'Years + types of projects',        style: TextInputStyle.Short },
    { id: 'turnaround',   label: 'Average turnaround time per video?',        placeholder: 'e.g. 24-48 hrs for a highlight',  style: TextInputStyle.Short },
    { id: 'whynxt',       label: 'Why do you want to edit for NXT?',          placeholder: 'Your goals with the org',          style: TextInputStyle.Paragraph },
  ],
};

const TYPE_LABELS = {
  competitive: '🎮 Competitive',
  creator:     '📹 Creator',
  designer:    '🎨 Designer',
  editor:      '🎬 Editor',
};

// ─── Slash command ─────────────────────────────────────────────────────────────

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Open the NXT Esports application panel'),

  // ── Step 1: Show type selection ────────────────────────────────────────────
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚡ NXT Esports — Applications')
      .setDescription(
        'Ready to represent NXT? Choose your role below to begin your application.\n\n' +
        '🎮 **Competitive** — Arena & tournament players\n' +
        '📹 **Creator** — Content creators & streamers\n' +
        '🎨 **Designer** — Graphic designers & artists\n' +
        '🎬 **Editor** — Video editors\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '**📋 Activity & Inactivity Policy**\n' +
        '> All NXT members are expected to remain **active**.\n' +
        '> Members inactive for **48+ hours without notice** will be removed.\n' +
        '> \n' +
        '> **Exceptions** (must be approved by staff):\n' +
        '> ▸ Staff-issued **Inactive Pass**\n' +
        '> ▸ Personal emergency\n' +
        '> ▸ Scheduled vacation (communicated in advance)\n' +
        '> \n' +
        '> Always DM a **Staff member before going inactive**.\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '*By submitting an application, you acknowledge this policy.*'
      )
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('apply_competitive').setLabel('Competitive').setEmoji('🎮').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('apply_creator').setLabel('Creator').setEmoji('📹').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('apply_designer').setLabel('Designer').setEmoji('🎨').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('apply_editor').setLabel('Editor').setEmoji('🎬').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  // ─── Button handler — routes all apply_* buttons ───────────────────────────
  async handleButton(interaction) {
    const id = interaction.customId;

    // Competitive → show region select
    if (id === 'apply_competitive') {
      return this._showRegionSelect(interaction);
    }

    // Other types → show modal directly
    if (id === 'apply_creator' || id === 'apply_designer' || id === 'apply_editor') {
      return this._showOtherModal(interaction, id.replace('apply_', ''));
    }

    // Region chosen → show platform select
    if (id.startsWith('apply_region_')) {
      return this._showPlatformSelect(interaction, id);
    }

    // Platform chosen → show competitive modal
    if (id.startsWith('apply_platform_')) {
      return this._showCompetitiveModal(interaction, id);
    }
  },

  // ─── Step 2: Region buttons ────────────────────────────────────────────────
  async _showRegionSelect(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🌍 Select Your Region')
      .setDescription(
        'Which region do you **primarily compete** in?\n\n' +
        'This determines your scrim lobbies and tournament placement.'
      )
      .setColor(config.color)
      .setFooter({ text: `${config.footer}  •  Step 1 of 2` });

    // Split 7 regions across two rows: 4 + 3
    const row1 = new ActionRowBuilder().addComponents(
      REGIONS.slice(0, 4).map(r =>
        new ButtonBuilder()
          .setCustomId(`apply_region_competitive_${r.id}`)
          .setLabel(r.label)
          .setEmoji(r.emoji)
          .setStyle(ButtonStyle.Primary)
      )
    );
    const row2 = new ActionRowBuilder().addComponents(
      REGIONS.slice(4).map(r =>
        new ButtonBuilder()
          .setCustomId(`apply_region_competitive_${r.id}`)
          .setLabel(r.label)
          .setEmoji(r.emoji)
          .setStyle(ButtonStyle.Primary)
      )
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  },

  // ─── Step 3: Platform buttons ──────────────────────────────────────────────
  async _showPlatformSelect(interaction, customId) {
    // customId: apply_region_competitive_NAE
    const region = customId.split('_').pop();
    const regionLabel = REGIONS.find(r => r.id === region)?.label || region;

    const embed = new EmbedBuilder()
      .setTitle('🎮 Select Your Platform')
      .setDescription(`**Region:** ${regionLabel}\n\nWhat device do you primarily compete on?`)
      .setColor(config.color)
      .setFooter({ text: `${config.footer}  •  Step 2 of 2` });

    const row = new ActionRowBuilder().addComponents(
      PLATFORMS.map(p =>
        new ButtonBuilder()
          .setCustomId(`apply_platform_competitive_${region}_${p.id}`)
          .setLabel(p.label)
          .setEmoji(p.emoji)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.update({ embeds: [embed], components: [row] });
  },

  // ─── Step 4: Competitive modal ─────────────────────────────────────────────
  async _showCompetitiveModal(interaction, customId) {
    // customId: apply_platform_competitive_NAE_PC
    const parts = customId.split('_');
    const platform = parts[parts.length - 1];
    const region = parts[parts.length - 2];

    const modal = new ModalBuilder()
      .setCustomId(`apply_modal_competitive_${region}_${platform}`)
      .setTitle('⚡ NXT Competitive Application');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ign')
          .setLabel('Fortnite Username (IGN)')
          .setPlaceholder('Your exact in-game username')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('rank')
          .setLabel('Current Rank / Arena Stats')
          .setPlaceholder('e.g. Contender Div 3  |  Top 5%  |  14 PR')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('availability')
          .setLabel('Daily Availability (hours per day)')
          .setPlaceholder('e.g. Weekdays: 4hrs  |  Weekends: 8hrs')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('whynxt')
          .setLabel('Why do you want to join NXT Esports?')
          .setPlaceholder('Tell us your goals, experience, and what you bring to the roster.')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('policy')
          .setLabel('Inactivity Policy — Type "I AGREE" to confirm')
          .setPlaceholder('I AGREE')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(10)
      )
    );

    await interaction.showModal(modal);
  },

  // ─── Non-competitive modal (creator / designer / editor) ──────────────────
  async _showOtherModal(interaction, type) {
    const questions = OTHER_QUESTIONS[type];
    if (!questions) return;

    const modal = new ModalBuilder()
      .setCustomId(`apply_modal_${type}`)
      .setTitle(`NXT ${type.charAt(0).toUpperCase() + type.slice(1)} Application`);

    modal.addComponents(
      ...questions.slice(0, 5).map(q =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(q.id)
            .setLabel(q.label)
            .setPlaceholder(q.placeholder)
            .setStyle(q.style)
            .setRequired(true)
            .setMaxLength(1000)
        )
      )
    );

    await interaction.showModal(modal);
  },

  // ─── Modal submission handler ──────────────────────────────────────────────
  async handleModal(interaction) {
    // IDs: apply_modal_competitive_NAE_PC  OR  apply_modal_creator
    const raw = interaction.customId.replace('apply_modal_', '');
    const parts = raw.split('_');
    const type = parts[0];

    await interaction.deferReply({ ephemeral: true });

    let answers = {};
    let regionLabel = null;
    let platformLabel = null;

    if (type === 'competitive') {
      const region = parts[1];
      const platform = parts[2];
      regionLabel   = REGIONS.find(r => r.id === region)?.label || region;
      platformLabel = PLATFORMS.find(p => p.id === platform)?.label || platform;

      // Validate policy
      const policy = interaction.fields.getTextInputValue('policy').trim().toUpperCase();
      if (policy !== 'I AGREE') {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setDescription('❌ You must type **I AGREE** in the inactivity policy field to submit your application.')
            .setColor(config.colorError)
            .setFooter({ text: config.footer })],
        });
      }

      answers = {
        region:       regionLabel,
        platform:     platformLabel,
        ign:          interaction.fields.getTextInputValue('ign'),
        rank:         interaction.fields.getTextInputValue('rank'),
        availability: interaction.fields.getTextInputValue('availability'),
        whynxt:       interaction.fields.getTextInputValue('whynxt'),
      };
    } else {
      const questions = OTHER_QUESTIONS[type] || [];
      for (const q of questions) {
        try { answers[q.id] = interaction.fields.getTextInputValue(q.id); } catch { answers[q.id] = 'N/A'; }
      }
    }

    saveApplication(interaction.guildId, interaction.user.id, type, answers);

    // ── Build staff embed ─────────────────────────────────────────────────────
    const appEmbed = new EmbedBuilder()
      .setTitle(`📋 New Application — ${TYPE_LABELS[type] || type}`)
      .setDescription(`**Applicant:** ${interaction.user} (${interaction.user.tag})\n**User ID:** \`${interaction.user.id}\``)
      .setColor(config.color)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: config.footer })
      .setTimestamp();

    if (type === 'competitive') {
      appEmbed.addFields(
        { name: '🌍 Region',             value: answers.region,       inline: true },
        { name: '🎮 Platform',           value: answers.platform,     inline: true },
        { name: '\u200b',                value: '\u200b',             inline: true },
        { name: '🏷️ Fortnite IGN',      value: answers.ign,          inline: false },
        { name: '🏆 Rank / Stats',       value: answers.rank,         inline: false },
        { name: '⏰ Daily Availability', value: answers.availability, inline: false },
        { name: '💬 Why NXT?',           value: answers.whynxt,       inline: false },
        { name: '📋 Policy',             value: '✅ Inactivity policy acknowledged', inline: false },
      );
    } else {
      const questions = OTHER_QUESTIONS[type] || [];
      for (const q of questions) {
        if (answers[q.id]) appEmbed.addFields({ name: q.label, value: answers[q.id], inline: false });
      }
    }

    // Accept / Deny buttons
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${interaction.user.id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`app_deny_${interaction.user.id}`).setLabel('Deny').setEmoji('❌').setStyle(ButtonStyle.Danger),
    );

    // ── Create private application ticket channel ──────────────────────────
    const guild = interaction.guild;
    const ticketCategoryId  = getConfig(interaction.guildId, 'ticket_category');
    const staffAppsChannelId = getConfig(interaction.guildId, 'staff_apps_channel');

    let ticketChannel = null;
    try {
      const category = ticketCategoryId ? guild.channels.cache.get(ticketCategoryId) : null;
      const staffRoles = guild.roles.cache.filter(r =>
        [config.roles.staff, config.roles.owner, config.roles.manager].includes(r.name)
      );

      ticketChannel = await guild.channels.create({
        name: `app-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`,
        type: ChannelType.GuildText,
        parent: category?.id,
        topic: `${type} application | ${interaction.user.tag} | ${interaction.user.id}`,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          ...staffRoles.map(r => ({
            id: r.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          })),
        ],
      });

      await ticketChannel.send({ embeds: [appEmbed], components: [actionRow] });
    } catch { /* channel creation not critical */ }

    // Post to staff applications channel if configured
    if (staffAppsChannelId) {
      const staffCh = guild.channels.cache.get(staffAppsChannelId);
      if (staffCh) await staffCh.send({ embeds: [appEmbed], components: [actionRow] }).catch(() => {});
    }

    // ── Confirmation to applicant ─────────────────────────────────────────────
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Application Submitted — NXT Esports')
      .setDescription(
        `Your **${TYPE_LABELS[type]}** application has been received!\n\n` +
        (ticketChannel ? `📂 **Application Ticket:** ${ticketChannel}\n\n` : '') +
        '**What happens next?**\n' +
        '> ▸ Staff will review your application within **48–72 hours**\n' +
        '> ▸ You\'ll be notified via DM or your ticket channel\n' +
        '> ▸ If accepted, staff will assign your role\n\n' +
        '**⚠️ Reminder — Inactivity Policy:**\n' +
        '> Once accepted, members inactive for **48+ hours without notice**\n' +
        '> will be **removed**. Always notify staff before going inactive.\n\n' +
        'Good luck! ⚡'
      )
      .setColor(config.colorSuccess)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  },
};
