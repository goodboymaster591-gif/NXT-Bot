/**
 * /apply — Opens application panel with buttons for each role type.
 * Clicking a button opens a modal with questions, then creates a private
 * ticket channel and posts results to the staff applications channel.
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

// ─── Application questions per type ──────────────────────────────────────────

const appQuestions = {
  competitive: [
    { id: 'ign', label: 'What is your Fortnite IGN (In-Game Name)?', placeholder: 'Your Fortnite username', style: TextInputStyle.Short },
    { id: 'rank', label: 'Current Arena rank / placement stats?', placeholder: 'e.g. Contender 3 / Div 4', style: TextInputStyle.Short },
    { id: 'region', label: 'What region do you play in?', placeholder: 'e.g. NAE, NAW, EU', style: TextInputStyle.Short },
    { id: 'availability', label: 'What is your weekly scrim availability?', placeholder: 'Days and hours you can play', style: TextInputStyle.Paragraph },
    { id: 'whynxt', label: 'Why do you want to join NXT Esports?', placeholder: 'Tell us about yourself and your goals', style: TextInputStyle.Paragraph },
  ],
  creator: [
    { id: 'platform', label: 'What platforms do you post on?', placeholder: 'e.g. YouTube, TikTok, Twitch', style: TextInputStyle.Short },
    { id: 'links', label: 'Share your social media links', placeholder: 'YouTube: / TikTok: / Twitch:', style: TextInputStyle.Paragraph },
    { id: 'followers', label: 'What are your current follower/subscriber counts?', placeholder: 'Platform: Count', style: TextInputStyle.Short },
    { id: 'content', label: 'Describe your content style and posting schedule', placeholder: 'What do you make, how often?', style: TextInputStyle.Paragraph },
    { id: 'whynxt', label: 'Why do you want to create for NXT?', placeholder: 'Your goals and what you bring', style: TextInputStyle.Paragraph },
  ],
  designer: [
    { id: 'software', label: 'What design software do you use?', placeholder: 'e.g. Photoshop, Illustrator, Figma', style: TextInputStyle.Short },
    { id: 'portfolio', label: 'Share your portfolio link', placeholder: 'Portfolio URL or Behance', style: TextInputStyle.Short },
    { id: 'experience', label: 'How long have you been designing?', placeholder: 'Years of experience + background', style: TextInputStyle.Short },
    { id: 'services', label: 'What can you design? (logos, thumbnails, etc.)', placeholder: 'List your design capabilities', style: TextInputStyle.Paragraph },
    { id: 'whynxt', label: 'Why do you want to design for NXT?', placeholder: 'Tell us your motivation', style: TextInputStyle.Paragraph },
  ],
  editor: [
    { id: 'software', label: 'What editing software do you use?', placeholder: 'e.g. Premiere Pro, DaVinci Resolve', style: TextInputStyle.Short },
    { id: 'portfolio', label: 'Share a portfolio link or sample video', placeholder: 'YouTube link or drive folder', style: TextInputStyle.Short },
    { id: 'experience', label: 'How long have you been video editing?', placeholder: 'Years + types of projects', style: TextInputStyle.Short },
    { id: 'turnaround', label: 'What is your average turnaround time?', placeholder: 'e.g. 24-48 hours for a highlight clip', style: TextInputStyle.Short },
    { id: 'whynxt', label: 'Why do you want to edit for NXT?', placeholder: 'Your goals with the org', style: TextInputStyle.Paragraph },
  ],
};

// ─── Slash command ─────────────────────────────────────────────────────────────

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Open the NXT Esports application panel')
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚡ NXT Esports — Applications')
      .setDescription(
        'Want to be part of NXT? Select the role you\'re applying for below.\n\n' +
        '🎮 **Competitive** — Arena players looking to compete\n' +
        '📹 **Creator** — Content creators & streamers\n' +
        '🎨 **Designer** — Graphic designers & artists\n' +
        '🎬 **Editor** — Video editors\n\n' +
        '*Applications are reviewed by staff within 48-72 hours.*'
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

  // ─── Button interaction handler ────────────────────────────────────────────
  async handleButton(interaction) {
    const type = interaction.customId.replace('apply_', '');
    const questions = appQuestions[type];
    if (!questions) return;

    // Build modal with up to 5 questions
    const modal = new ModalBuilder()
      .setCustomId(`apply_modal_${type}`)
      .setTitle(`NXT ${type.charAt(0).toUpperCase() + type.slice(1)} Application`);

    const rows = questions.slice(0, 5).map(q =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(q.id)
          .setLabel(q.label)
          .setPlaceholder(q.placeholder)
          .setStyle(q.style)
          .setRequired(true)
          .setMaxLength(1000)
      )
    );

    modal.addComponents(...rows);
    await interaction.showModal(modal);
  },

  // ─── Modal submission handler ──────────────────────────────────────────────
  async handleModal(interaction) {
    const type = interaction.customId.replace('apply_modal_', '');
    const questions = appQuestions[type];
    if (!questions) return;

    await interaction.deferReply({ ephemeral: true });

    const answers = {};
    for (const q of questions) {
      try {
        answers[q.id] = interaction.fields.getTextInputValue(q.id);
      } catch {
        answers[q.id] = 'Not provided';
      }
    }

    // Save to database
    saveApplication(interaction.guildId, interaction.user.id, type, answers);

    // Create private ticket channel for this application
    const guild = interaction.guild;
    const ticketCategory = getConfig(interaction.guildId, 'ticket_category');
    const staffAppsChannelId = getConfig(interaction.guildId, 'staff_apps_channel');

    let ticketChannel = null;
    try {
      const categoryChannel = ticketCategory
        ? guild.channels.cache.get(ticketCategory) || guild.channels.cache.find(c => c.name === config.channels.ticketCategory && c.type === ChannelType.GuildCategory)
        : null;

      ticketChannel = await guild.channels.create({
        name: `app-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        type: ChannelType.GuildText,
        parent: categoryChannel?.id,
        topic: `Application from ${interaction.user.tag} — ${type}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          // Allow staff roles to see the channel
          ...guild.roles.cache
            .filter(r => [config.roles.staff, config.roles.owner, config.roles.manager].includes(r.name))
            .map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })),
        ],
      });
    } catch {
      // Continue even if channel creation fails
    }

    // Build the application summary embed
    const typeLabels = { competitive: '🎮 Competitive', creator: '📹 Creator', designer: '🎨 Designer', editor: '🎬 Editor' };
    const appEmbed = new EmbedBuilder()
      .setTitle(`📋 New Application — ${typeLabels[type] || type}`)
      .setDescription(`Application submitted by ${interaction.user} (${interaction.user.tag})`)
      .setColor(config.color)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: config.footer })
      .setTimestamp();

    for (const q of questions) {
      if (answers[q.id]) {
        appEmbed.addFields({ name: q.label, value: answers[q.id] || 'N/A', inline: false });
      }
    }

    appEmbed.addFields({ name: 'User ID', value: interaction.user.id, inline: true });

    // Accept/Deny buttons
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${interaction.user.id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`app_deny_${interaction.user.id}`).setLabel('Deny').setEmoji('❌').setStyle(ButtonStyle.Danger),
    );

    // Post to ticket channel and staff applications channel
    if (ticketChannel) {
      await ticketChannel.send({ embeds: [appEmbed], components: [actionRow] });
    }

    if (staffAppsChannelId) {
      const staffCh = guild.channels.cache.get(staffAppsChannelId);
      if (staffCh) await staffCh.send({ embeds: [appEmbed], components: [actionRow] });
    }

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Application Submitted!')
      .setDescription(
        `Your **${typeLabels[type]}** application has been submitted successfully!\n\n` +
        (ticketChannel ? `Your application ticket: ${ticketChannel}\n` : '') +
        '\nOur staff team will review your application within **48-72 hours**. Good luck! ⚡'
      )
      .setColor(config.colorSuccess)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  },
};
