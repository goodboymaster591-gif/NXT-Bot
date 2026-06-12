/**
 * /revamp1 — Full server setup command.
 *
 * Creates:
 *  • All NXT roles with correct colors and permissions
 *  • VERIFY category → #get-verified (visible to everyone; verify button grants access)
 *  • INFORMATION category → #announcements, #rules  (Verified+ read-only)
 *  • GENERAL category → #general, #off-topic        (Verified+)
 *  • APPLICATIONS category → #apply-here             (Verified+, bot posts apply panel)
 *  • COMPETITIVE category → #roster, #scrims, #strategy (NXT Member+)
 *  • STAFF category → #staff-chat, #staff-apps, #mod-logs (Staff only)
 *  • TICKETS category (hidden; managed by ticket system)
 *
 * @everyone: denied ViewChannel everywhere except #get-verified.
 * Verified role: unlocks all general / info / applications channels.
 * NXT Member+: also unlocks competitive channels.
 * Staff roles: full access to staff channels + moderation perms.
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const config = require('../../config.js');
const { setConfig } = require('../../utils/database.js');

// ─── Role definitions ─────────────────────────────────────────────────────────

const ROLE_DEFS = [
  // Staff hierarchy (highest first for display order)
  { name: 'NXT | Owner',      color: 0xEF4444, hoist: true,  mentionable: false, perms: PermissionFlagsBits.Administrator },
  { name: 'NXT | CEO',        color: 0xF97316, hoist: true,  mentionable: false, perms: PermissionFlagsBits.Administrator },
  { name: 'NXT | Manager',    color: 0xF59E0B, hoist: true,  mentionable: true,  perms: PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageMessages | PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers | PermissionFlagsBits.MuteMembers },
  { name: 'NXT | Staff',      color: 0x8B5CF6, hoist: true,  mentionable: true,  perms: PermissionFlagsBits.ManageMessages | PermissionFlagsBits.KickMembers | PermissionFlagsBits.MuteMembers | PermissionFlagsBits.ModerateMembers },
  { name: 'NXT | Coach',      color: 0x6366F1, hoist: true,  mentionable: true,  perms: 0n },
  { name: 'NXT | Recruiter',  color: 0xA78BFA, hoist: false, mentionable: true,  perms: 0n },
  // Competitive roster
  { name: 'NXT | Pro',        color: 0xFACC15, hoist: true,  mentionable: true,  perms: 0n },
  { name: 'NXT | Competitive',color: 0x22C55E, hoist: true,  mentionable: true,  perms: 0n },
  { name: 'NXT | Academy',    color: 0x34D399, hoist: true,  mentionable: true,  perms: 0n },
  { name: 'NXT | Recruit',    color: 0x6EE7B7, hoist: false, mentionable: true,  perms: 0n },
  // Content team
  { name: 'NXT | Creator',    color: 0xF472B6, hoist: true,  mentionable: true,  perms: 0n },
  { name: 'NXT | Designer',   color: 0xFB7185, hoist: false, mentionable: true,  perms: 0n },
  { name: 'NXT | Editor',     color: 0xFDA4AF, hoist: false, mentionable: true,  perms: 0n },
  // Base access roles
  { name: 'NXT | Member',     color: 0x8B5CF6, hoist: false, mentionable: false, perms: 0n },
  { name: 'Verified',         color: 0x94A3B8, hoist: false, mentionable: false, perms: 0n },
];

// ─── Channel structure ────────────────────────────────────────────────────────

// Permission bit combos
const READ_ONLY = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory];
const READ_WRITE = [...READ_ONLY, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.UseApplicationCommands];
const FULL_MOD   = [...READ_WRITE, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('revamp1')
    .setDescription('⚡ Full NXT server setup — creates all roles, channels, and permissions')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const steps = [];
    const log = (msg) => { steps.push(msg); };

    try {
      // ── 1. Create / fetch all roles ────────────────────────────────────────
      log('**Creating roles...**');
      const roles = {};

      for (const def of ROLE_DEFS) {
        let role = guild.roles.cache.find(r => r.name === def.name);
        if (!role) {
          role = await guild.roles.create({
            name: def.name,
            color: def.color,
            hoist: def.hoist,
            mentionable: def.mentionable,
            permissions: def.perms,
          });
          log(`✅ Created role **${def.name}**`);
        } else {
          log(`♻️ Found role **${def.name}**`);
        }
        roles[def.name] = role;
      }

      const everyoneRole  = guild.roles.everyone;
      const verifiedRole  = roles['Verified'];
      const memberRole    = roles['NXT | Member'];
      const staffRoles    = ['NXT | Staff', 'NXT | Manager', 'NXT | Owner', 'NXT | CEO'].map(n => roles[n]);
      const compRoles     = ['NXT | Pro', 'NXT | Competitive', 'NXT | Academy', 'NXT | Recruit', 'NXT | Coach'].map(n => roles[n]);
      const contentRoles  = ['NXT | Creator', 'NXT | Designer', 'NXT | Editor'].map(n => roles[n]);
      const recruiterRole = roles['NXT | Recruiter'];

      // Helper: build overwrite arrays
      const denyAll      = { id: everyoneRole, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] };
      const verifiedRead = { id: verifiedRole, allow: READ_ONLY };
      const verifiedRW   = { id: verifiedRole, allow: READ_WRITE };
      const memberRW     = { id: memberRole,   allow: READ_WRITE };
      const staffFull    = staffRoles.map(r => ({ id: r, allow: FULL_MOD }));
      const compRead     = compRoles.map(r => ({ id: r, allow: READ_WRITE }));
      const contentRead  = contentRoles.map(r => ({ id: r, allow: READ_WRITE }));

      // ── 2. Set @everyone base permissions (no view access) ─────────────────
      log('\n**Configuring @everyone permissions...**');
      await everyoneRole.setPermissions(0n);
      log('✅ @everyone base permissions cleared');

      // ── 3. Create VERIFY category ──────────────────────────────────────────
      log('\n**Creating VERIFY gate...**');

      let verifyCat = guild.channels.cache.find(c => c.name === '📋 VERIFY' && c.type === ChannelType.GuildCategory);
      if (!verifyCat) {
        verifyCat = await guild.channels.create({
          name: '📋 VERIFY',
          type: ChannelType.GuildCategory,
          position: 0,
          permissionOverwrites: [
            { id: everyoneRole, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            ...staffFull,
          ],
        });
        log('✅ Created **📋 VERIFY** category');
      }

      let verifyChannel = guild.channels.cache.find(c => c.name === 'get-verified' && c.parentId === verifyCat.id);
      if (!verifyChannel) {
        verifyChannel = await guild.channels.create({
          name: 'get-verified',
          type: ChannelType.GuildText,
          parent: verifyCat.id,
          topic: 'Click the button below to verify and access the full server.',
          permissionOverwrites: [
            { id: everyoneRole, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] },
            ...staffFull,
          ],
        });
        log('✅ Created **#get-verified** channel');
      }

      // Post verify embed
      const verifyEmbed = new EmbedBuilder()
        .setTitle('⚡ Welcome to NXT Esports!')
        .setDescription(
          'To gain access to the full server, click the **Verify** button below.\n\n' +
          '> By verifying, you agree to follow all server rules and the NXT Esports code of conduct.\n\n' +
          '**What you\'ll unlock:**\n' +
          '▸ General chat and community channels\n' +
          '▸ Announcements and important updates\n' +
          '▸ Applications to join the NXT roster\n' +
          '▸ Events, scrims, and community activities\n\n' +
          '*Having issues? Open a support ticket.*'
        )
        .setColor(config.color)
        .setFooter({ text: config.footer })
        .setTimestamp();

      const verifyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_join')
          .setLabel('Verify & Enter Server')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success)
      );

      // Clear old messages and post fresh embed
      const existingMsgs = await verifyChannel.messages.fetch({ limit: 10 });
      const botMsgs = existingMsgs.filter(m => m.author.bot && m.components.length > 0);
      for (const msg of botMsgs.values()) await msg.delete().catch(() => {});

      await verifyChannel.send({ embeds: [verifyEmbed], components: [verifyRow] });
      log('✅ Posted verification embed with button');

      // ── 4. Create INFORMATION category ────────────────────────────────────
      log('\n**Creating INFORMATION channels...**');

      let infoCat = guild.channels.cache.find(c => c.name === '📢 INFORMATION' && c.type === ChannelType.GuildCategory);
      if (!infoCat) {
        infoCat = await guild.channels.create({
          name: '📢 INFORMATION',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            denyAll,
            { id: verifiedRole, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            ...staffFull,
          ],
        });
        log('✅ Created **📢 INFORMATION** category');
      }

      for (const chName of ['announcements', 'rules', 'requirements']) {
        const existing = guild.channels.cache.find(c => c.name === chName && c.parentId === infoCat.id);
        if (!existing) {
          await guild.channels.create({
            name: chName,
            type: ChannelType.GuildText,
            parent: infoCat.id,
            permissionOverwrites: [
              denyAll,
              { id: verifiedRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
              ...staffFull,
            ],
          });
          log(`✅ Created **#${chName}**`);
        }
      }

      // ── 5. Create GENERAL category ─────────────────────────────────────────
      log('\n**Creating GENERAL channels...**');

      let generalCat = guild.channels.cache.find(c => c.name === '💬 GENERAL' && c.type === ChannelType.GuildCategory);
      if (!generalCat) {
        generalCat = await guild.channels.create({
          name: '💬 GENERAL',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [denyAll, verifiedRW, ...staffFull],
        });
        log('✅ Created **💬 GENERAL** category');
      }

      let generalChannel = null;
      for (const chName of ['general', 'off-topic', 'media']) {
        const existing = guild.channels.cache.find(c => c.name === chName && c.parentId === generalCat.id);
        if (!existing) {
          const ch = await guild.channels.create({
            name: chName,
            type: ChannelType.GuildText,
            parent: generalCat.id,
            permissionOverwrites: [denyAll, verifiedRW, ...staffFull],
          });
          if (chName === 'general') generalChannel = ch;
          log(`✅ Created **#${chName}**`);
        } else if (chName === 'general') {
          generalChannel = existing;
        }
      }

      // ── 6. Create APPLICATIONS category ───────────────────────────────────
      log('\n**Creating APPLICATIONS channel...**');

      let appCat = guild.channels.cache.find(c => c.name === '📋 APPLICATIONS' && c.type === ChannelType.GuildCategory);
      if (!appCat) {
        appCat = await guild.channels.create({
          name: '📋 APPLICATIONS',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            denyAll,
            { id: verifiedRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
            ...staffFull,
          ],
        });
        log('✅ Created **📋 APPLICATIONS** category');
      }

      let applyChannel = guild.channels.cache.find(c => c.name === 'apply-here' && c.parentId === appCat.id);
      if (!applyChannel) {
        applyChannel = await guild.channels.create({
          name: 'apply-here',
          type: ChannelType.GuildText,
          parent: appCat.id,
          topic: 'Apply to join the NXT Esports roster.',
          permissionOverwrites: [
            denyAll,
            { id: verifiedRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
            ...staffFull,
          ],
        });
        log('✅ Created **#apply-here**');
      }

      // Post the application panel
      const existingAppMsgs = await applyChannel.messages.fetch({ limit: 10 });
      const botAppMsgs = existingAppMsgs.filter(m => m.author.bot && m.components.length > 0);
      for (const msg of botAppMsgs.values()) await msg.delete().catch(() => {});

      const applyEmbed = new EmbedBuilder()
        .setTitle('⚡ NXT Esports — Applications')
        .setDescription(
          'Ready to represent NXT? Click the button below to open your application.\n\n' +
          '🎮 **Competitive** — Arena & tournament players\n' +
          '📹 **Creator** — Content creators & streamers\n' +
          '🎨 **Designer** — Graphic designers & artists\n' +
          '🎬 **Editor** — Video editors\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '**⚠️ Inactivity Policy**\n' +
          '> Members inactive **48+ hours without notice** are removed.\n' +
          '> Always DM staff **before** going inactive.\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '*Applications reviewed within 48–72 hours.*'
        )
        .setColor(config.color)
        .setFooter({ text: config.footer })
        .setTimestamp();

      const applyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('apply_competitive').setLabel('Competitive').setEmoji('🎮').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('apply_creator').setLabel('Creator').setEmoji('📹').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('apply_designer').setLabel('Designer').setEmoji('🎨').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('apply_editor').setLabel('Editor').setEmoji('🎬').setStyle(ButtonStyle.Secondary),
      );

      await applyChannel.send({ embeds: [applyEmbed], components: [applyRow] });
      setConfig(guild.id, 'apply_channel', applyChannel.id);
      log('✅ Posted application panel in **#apply-here**');

      // ── 7. Create COMPETITIVE category ─────────────────────────────────────
      log('\n**Creating COMPETITIVE channels...**');

      let compCat = guild.channels.cache.find(c => c.name === '🎮 COMPETITIVE' && c.type === ChannelType.GuildCategory);
      if (!compCat) {
        compCat = await guild.channels.create({
          name: '🎮 COMPETITIVE',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [denyAll, memberRW, ...compRead, ...staffFull],
        });
        log('✅ Created **🎮 COMPETITIVE** category');
      }

      for (const chName of ['roster', 'scrims', 'strategy', 'competitive-chat']) {
        const existing = guild.channels.cache.find(c => c.name === chName && c.parentId === compCat.id);
        if (!existing) {
          await guild.channels.create({
            name: chName,
            type: ChannelType.GuildText,
            parent: compCat.id,
            permissionOverwrites: [denyAll, memberRW, ...compRead, ...staffFull],
          });
          log(`✅ Created **#${chName}**`);
        }
      }

      // ── 8. Create STAFF category ───────────────────────────────────────────
      log('\n**Creating STAFF channels...**');

      let staffCat = guild.channels.cache.find(c => c.name === '🔒 STAFF' && c.type === ChannelType.GuildCategory);
      if (!staffCat) {
        staffCat = await guild.channels.create({
          name: '🔒 STAFF',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            denyAll,
            ...staffFull,
            { id: recruiterRole, allow: READ_WRITE },
          ],
        });
        log('✅ Created **🔒 STAFF** category');
      }

      let staffAppsChannel = null;
      let logChannel = null;
      for (const chName of ['staff-chat', 'staff-applications', 'mod-logs', 'ticket-transcripts']) {
        const existing = guild.channels.cache.find(c => c.name === chName && c.parentId === staffCat.id);
        let ch = existing;
        if (!existing) {
          ch = await guild.channels.create({
            name: chName,
            type: ChannelType.GuildText,
            parent: staffCat.id,
            permissionOverwrites: [
              denyAll,
              ...staffFull,
              ...(chName === 'staff-applications' ? [{ id: recruiterRole, allow: READ_WRITE }] : []),
            ],
          });
          log(`✅ Created **#${chName}**`);
        }
        if (chName === 'staff-applications') staffAppsChannel = ch;
        if (chName === 'mod-logs')           logChannel = ch;
      }

      // ── 9. Create TICKETS category ─────────────────────────────────────────
      log('\n**Creating TICKETS category...**');

      let ticketsCat = guild.channels.cache.find(c => c.name === '🎟 TICKETS' && c.type === ChannelType.GuildCategory);
      if (!ticketsCat) {
        ticketsCat = await guild.channels.create({
          name: '🎟 TICKETS',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [denyAll, ...staffFull],
        });
        log('✅ Created **🎟 TICKETS** category');
      }

      // ── 10. Save channel IDs to config ────────────────────────────────────
      if (staffAppsChannel) setConfig(guild.id, 'staff_apps_channel', staffAppsChannel.id);
      if (logChannel)       setConfig(guild.id, 'log_channel', logChannel.id);
      if (ticketsCat)       setConfig(guild.id, 'ticket_category', ticketsCat.id);
      if (verifyChannel)    setConfig(guild.id, 'verify_channel', verifyChannel.id);

      log('\n✅ **All configurations saved!**');

      // ── 11. Summary reply ─────────────────────────────────────────────────
      const summaryEmbed = new EmbedBuilder()
        .setTitle('⚡ NXT Server Revamp Complete!')
        .setDescription(
          steps.join('\n') + '\n\n' +
          '**🎯 What to do next:**\n' +
          '> ・ Run `/rules` in **#rules** to post the rules embed\n' +
          '> ・ Run `/requirements` in **#requirements** to post requirements\n' +
          '> ・ Run `/panel` in any channel for a ticket support panel\n' +
          '> ・ Assign yourself the **NXT | Owner** role if not already done\n\n' +
          '*All channels and roles are configured. New members will see only **#get-verified** until they verify.*'
        )
        .setColor(config.colorSuccess)
        .setFooter({ text: config.footer })
        .setTimestamp();

      await interaction.editReply({ embeds: [summaryEmbed] });

    } catch (err) {
      const errEmbed = new EmbedBuilder()
        .setTitle('❌ Revamp Error')
        .setDescription(
          `An error occurred during setup:\n\`\`\`${err.message}\`\`\`\n\n` +
          '**Progress so far:**\n' + steps.join('\n')
        )
        .setColor(config.colorError)
        .setFooter({ text: config.footer });

      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
