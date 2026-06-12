/**
 * Fires once when the bot successfully connects to Discord.
 */

const { ActivityType } = require('discord.js');
const logger = require('../utils/logger.js');
const config = require('../config.js');

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s) | ${client.users.cache.size} users`);

    // Set bot activity
    client.user.setPresence({
      activities: [{ name: '⚡ NXT | NEXT UP', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
