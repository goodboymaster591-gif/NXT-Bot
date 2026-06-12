const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('socials')
    .setDescription('View NXT Esports social media links'),

  async execute(interaction) {
    const { socials } = config;

    const links = [
      socials.twitter && `[🐦 Twitter](${socials.twitter})`,
      socials.instagram && `[📸 Instagram](${socials.instagram})`,
      socials.tiktok && `[🎵 TikTok](${socials.tiktok})`,
      socials.youtube && `[▶️ YouTube](${socials.youtube})`,
      socials.twitch && `[💜 Twitch](${socials.twitch})`,
      socials.website && `[🌐 Website](${socials.website})`,
    ].filter(Boolean);

    const embed = new EmbedBuilder()
      .setTitle('⚡ NXT Esports — Socials')
      .setDescription('Follow us to stay up to date with all things NXT!\n\n' + links.join('\n'))
      .setColor(config.color)
      .setFooter({ text: config.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
