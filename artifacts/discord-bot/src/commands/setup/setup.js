/**
 * /setup — Interactive setup wizard using select menus and buttons.
 * Configures: ticket category, staff roles, log channels, welcome channel, applications channel.
 */

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  ChannelType,
} = require('discord.js');
const config = require('../../config.js');
const { setConfig, getConfig } = require('../../utils/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Interactive NXT bot setup wizard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ NXT Esports — Setup Wizard')
      .setDescription(
        'Welcome to the NXT bot setup wizard!\n\n' +
        'Use the menus below to configure each setting. Run `/setup` again at any time to update.\n\n' +
        '**Current Configuration:**'
      )
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    // Show current config
    const keys = ['log_channel', 'welcome_channel', 'transcript_channel', 'staff_apps_channel', 'ticket_category'];
    const labels = ['🗒️ Log Channel', '👋 Welcome Channel', '📝 Transcript Channel', '📋 Staff Apps Channel', '🎟 Ticket Category'];

    for (let i = 0; i < keys.length; i++) {
      const val = getConfig(interaction.guildId, keys[i]);
      embed.addFields({ name: labels[i], value: val ? `<#${val}>` : '*Not set*', inline: true });
    }

    // Log channel select
    const logRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup_log_channel')
        .setPlaceholder('🗒️ Select Log Channel')
        .setChannelTypes(ChannelType.GuildText)
    );

    // Welcome channel select
    const welcomeRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup_welcome_channel')
        .setPlaceholder('👋 Select Welcome Channel')
        .setChannelTypes(ChannelType.GuildText)
    );

    // Transcript channel select
    const transcriptRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup_transcript_channel')
        .setPlaceholder('📝 Select Transcript Channel')
        .setChannelTypes(ChannelType.GuildText)
    );

    // Staff apps channel select
    const appsRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup_staff_apps_channel')
        .setPlaceholder('📋 Select Staff Applications Channel')
        .setChannelTypes(ChannelType.GuildText)
    );

    // Ticket category select
    const ticketRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('setup_ticket_category')
        .setPlaceholder('🎟 Select Ticket Category')
        .setChannelTypes(ChannelType.GuildCategory)
    );

    await interaction.reply({
      embeds: [embed],
      components: [logRow, welcomeRow, transcriptRow, appsRow, ticketRow],
      ephemeral: true,
    });
  },

  // ─── Select menu handler ───────────────────────────────────────────────────
  async handleSelectMenu(interaction) {
    const configKey = interaction.customId.replace('setup_', '');
    const value = interaction.values[0];
    if (!value) return;

    setConfig(interaction.guildId, configKey, value);

    const labels = {
      log_channel: '🗒️ Log Channel',
      welcome_channel: '👋 Welcome Channel',
      transcript_channel: '📝 Transcript Channel',
      staff_apps_channel: '📋 Staff Applications Channel',
      ticket_category: '🎟 Ticket Category',
    };

    const embed = new EmbedBuilder()
      .setDescription(`✅ **${labels[configKey] || configKey}** has been set to <#${value}>`)
      .setColor(config.colorSuccess)
      .setFooter({ text: config.footer });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
