/**
 * Central interaction router — handles slash commands, buttons, select menus, and modals.
 */

const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger.js');
const config = require('../config.js');

// Import handlers that expose button/modal/selectmenu methods
const applyCommand = require('../commands/applications/apply.js');
const panelCommand = require('../commands/tickets/panel.js');
const scrimCommand = require('../commands/scrims/scrim.js');
const setupCommand = require('../commands/setup/setup.js');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // ── Slash commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      logger.cmd(interaction.commandName);

      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error(`Error in /${interaction.commandName}: ${err.message}`);
        const errorEmbed = new EmbedBuilder()
          .setDescription('❌ An error occurred while running this command. Please try again.')
          .setColor(config.colorError)
          .setFooter({ text: config.footer });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // ── Button interactions ───────────────────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;

      // ── Verification button ──────────────────────────────────────────────
      if (id === 'verify_join') {
        const verifiedRole = interaction.guild.roles.cache.find(r => r.name === config.roles.verified)
          || interaction.guild.roles.cache.find(r => r.name === 'Verified');

        if (!verifiedRole) {
          return interaction.reply({
            content: '❌ Verified role not found. Ask an admin to run `/revamp1` first.',
            ephemeral: true,
          });
        }

        if (interaction.member.roles.cache.has(verifiedRole.id)) {
          return interaction.reply({ content: '✅ You are already verified!', ephemeral: true });
        }

        try {
          await interaction.member.roles.add(verifiedRole);

          const welcomeEmbed = new EmbedBuilder()
            .setTitle('⚡ Welcome to NXT Esports!')
            .setDescription(
              `You've been verified, ${interaction.user}! The server is now fully unlocked.\n\n` +
              '**Get started:**\n' +
              '> ▸ Check **#announcements** for updates\n' +
              '> ▸ Read **#rules** before chatting\n' +
              '> ▸ Apply to join the roster in **#apply-here**\n' +
              '> ▸ Open a **ticket** if you need help\n\n' +
              '*Good vibes only. Let\'s get it! ⚡*'
            )
            .setColor(config.colorSuccess)
            .setFooter({ text: config.footer })
            .setTimestamp();

          return interaction.reply({ embeds: [welcomeEmbed], ephemeral: true });
        } catch {
          return interaction.reply({
            content: '❌ Failed to assign Verified role. Make sure the bot\'s role is above "Verified" in the role list.',
            ephemeral: true,
          });
        }
      }

      // Application panel buttons
      if (id.startsWith('apply_') && !id.startsWith('apply_modal_') && !id.startsWith('apply_accept_') && !id.startsWith('apply_deny_')) {
        return applyCommand.handleButton(interaction);
      }

      // Application accept/deny (from staff panel)
      if (id.startsWith('app_accept_') || id.startsWith('app_deny_')) {
        const isStaff = interaction.member.roles.cache.some(r =>
          [config.roles.staff, config.roles.owner, config.roles.manager].includes(r.name)
        ) || interaction.member.permissions.has(8n);

        if (!isStaff) {
          return interaction.reply({ content: '❌ Only staff can accept or deny applications.', ephemeral: true });
        }

        const userId = id.replace('app_accept_', '').replace('app_deny_', '');
        const isAccept = id.startsWith('app_accept_');
        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        const responseEmbed = new EmbedBuilder()
          .setDescription(isAccept
            ? `✅ Application marked as **accepted** by ${interaction.user}.`
            : `❌ Application marked as **denied** by ${interaction.user}.`)
          .setColor(isAccept ? config.colorSuccess : config.colorError)
          .setFooter({ text: config.footer });

        await interaction.update({ embeds: [...interaction.message.embeds, responseEmbed], components: [] });

        if (member) {
          const dm = new EmbedBuilder()
            .setTitle(isAccept ? '🎉 Application Accepted!' : 'NXT Esports — Application Update')
            .setDescription(isAccept
              ? 'Congratulations! Your NXT Esports application has been **accepted**! Welcome to the family ⚡\n\nA staff member will reach out with next steps.'
              : 'Thank you for your interest in NXT Esports. After reviewing your application, we\'ve decided not to move forward at this time. Keep improving and feel free to apply again!')
            .setColor(isAccept ? config.colorSuccess : config.colorError)
            .setFooter({ text: config.footer })
            .setTimestamp();

          await member.send({ embeds: [dm] }).catch(() => {});
        }
        return;
      }

      // Ticket panel buttons
      if (id.startsWith('ticket_')) {
        return panelCommand.handleButton(interaction);
      }

      // Scrim attendance buttons
      if (id.startsWith('scrim_attend_') || id.startsWith('scrim_absent_')) {
        return scrimCommand.handleButton(interaction);
      }

      logger.warn(`Unhandled button: ${id}`);
      return;
    }

    // ── Select menu interactions ──────────────────────────────────────────────
    if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu()) {
      const id = interaction.customId;

      if (id.startsWith('setup_')) {
        return setupCommand.handleSelectMenu(interaction);
      }

      logger.warn(`Unhandled select menu: ${id}`);
      return;
    }

    // ── Modal submissions ─────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      if (id.startsWith('apply_modal_')) {
        return applyCommand.handleModal(interaction);
      }

      logger.warn(`Unhandled modal: ${id}`);
      return;
    }
  },
};
