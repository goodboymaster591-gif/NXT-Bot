/**
 * NXT Esports Bot Configuration
 * Edit this file to customize the bot's appearance and settings.
 */

module.exports = {
  // ─── Branding ──────────────────────────────────────────────────────────────
  color: 0x8B5CF6,           // Primary purple color used in all embeds
  colorSuccess: 0x22C55E,    // Green for success messages
  colorError: 0xEF4444,      // Red for error messages
  colorWarning: 0xF59E0B,    // Amber for warnings/caution
  colorInfo: 0x3B82F6,       // Blue for informational embeds

  footer: '⚡ NXT | NEXT UP',
  logoUrl: null,              // Set to your org logo URL if desired

  // ─── Organization Info ─────────────────────────────────────────────────────
  orgName: 'NXT Esports',
  game: 'Fortnite',

  socials: {
    twitter: 'https://twitter.com/NXTEsports',
    instagram: 'https://instagram.com/NXTEsports',
    tiktok: 'https://tiktok.com/@NXTEsports',
    youtube: 'https://youtube.com/@NXTEsports',
    twitch: 'https://twitch.tv/NXTEsports',
    website: 'https://nxtesports.gg',
  },

  // ─── Roles Configuration ───────────────────────────────────────────────────
  // These are role NAME strings. Update to match your actual Discord role names.
  roles: {
    // Staff / Admin
    owner: 'NXT | Owner',
    ceo: 'NXT | CEO',
    staff: 'NXT | Staff',
    manager: 'NXT | Manager',
    coach: 'NXT | Coach',
    recruiter: 'NXT | Recruiter',

    // Competitive roster
    pro: 'NXT | Pro',
    competitive: 'NXT | Competitive',
    academy: 'NXT | Academy',
    recruit: 'NXT | Recruit',

    // Content team
    creator: 'NXT | Creator',
    designer: 'NXT | Designer',
    editor: 'NXT | Editor',

    // Member
    member: 'NXT | Member',
    verified: 'Verified',
  },

  // ─── Channel Names ─────────────────────────────────────────────────────────
  // Update these to match your server's channel names (or configure via /setup).
  channels: {
    welcome: 'welcome',
    logs: 'mod-logs',
    applications: 'applications',
    staffApps: 'staff-applications',
    transcripts: 'ticket-transcripts',
    scrims: 'scrims',
    announcements: 'announcements',
  },

  // ─── Ticket Settings ───────────────────────────────────────────────────────
  ticketCategory: 'TICKETS',   // Category name for ticket channels
  maxOpenTickets: 1,            // Max open tickets per user

  // ─── Anti-Spam Settings ────────────────────────────────────────────────────
  antiSpam: {
    enabled: true,
    maxMessages: 5,    // Max messages in timeWindow before action
    timeWindow: 5000,  // 5 seconds window
    muteDuration: 10,  // Minutes to mute on spam detection
  },

  // ─── Rules ─────────────────────────────────────────────────────────────────
  rules: [
    '**1. Respect Everyone** — Treat all members with respect. Harassment, bullying, or discrimination will not be tolerated.',
    '**2. No Toxicity** — Keep a positive environment. Trash talk or negativity toward teammates or opponents is not allowed.',
    '**3. English Only** — Please keep all main channels in English so staff can moderate effectively.',
    '**4. No Spam** — Do not spam messages, emotes, or mentions. This includes mass pinging.',
    '**5. No Self-Promotion** — Do not advertise other servers, streams, or social media without permission.',
    '**6. No NSFW Content** — This is a gaming server. Keep all content appropriate.',
    '**7. Follow Discord ToS** — All members must comply with Discord\'s Terms of Service.',
    '**8. Respect Staff** — Follow staff instructions. If you have a complaint, open a support ticket.',
    '**9. No Cheating** — Using hacks, exploits, or cheats in any competitive setting results in immediate removal.',
    '**10. Have Fun** — We\'re here to compete and grow together. Good vibes only! ⚡',
  ],

  // ─── Requirements ──────────────────────────────────────────────────────────
  requirements: {
    competitive: [
      'Arena Rank: Contender League or higher',
      'Chapter placements in top 20%',
      'KD of 2.0+ in pubs',
      'Consistent availability for scrims',
      'Discord required with working mic',
      'Positive attitude and team-first mentality',
    ],
    creator: [
      'Active on at least one platform (YouTube/TikTok/Twitch)',
      'Consistent posting schedule',
      'Fortnite-focused content',
      'Minimum 500 followers/subscribers',
      'Quality production value',
    ],
    designer: [
      'Portfolio of previous work required',
      'Experience with Adobe Suite or Figma',
      'Available for quick turnaround',
      'Thumbnails, logos, and graphics capability',
    ],
    editor: [
      'Video editing portfolio required',
      'Experience with Premiere Pro, DaVinci Resolve, or similar',
      'Fast turnaround on highlight clips',
      'Understanding of esports/gaming content style',
    ],
  },
};
