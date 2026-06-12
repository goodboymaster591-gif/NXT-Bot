/**
 * Shared embed builders for NXT Esports bot
 * All embeds use the purple #8B5CF6 brand color with the ⚡ NXT footer.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

/**
 * Creates a standard NXT-branded embed.
 * @param {string} title
 * @param {string} description
 * @param {number} [color]
 * @returns {EmbedBuilder}
 */
function createEmbed(title, description, color = config.color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: config.footer })
    .setTimestamp();
}

/**
 * Creates a success embed (green).
 */
function successEmbed(title, description) {
  return createEmbed(title, description, config.colorSuccess);
}

/**
 * Creates an error embed (red).
 */
function errorEmbed(description) {
  return createEmbed('❌ Error', description, config.colorError);
}

/**
 * Creates a warning embed (amber).
 */
function warningEmbed(title, description) {
  return createEmbed(title, description, config.colorWarning);
}

/**
 * Creates an info embed (blue).
 */
function infoEmbed(title, description) {
  return createEmbed(title, description, config.colorInfo);
}

/**
 * Creates a permission-denied embed.
 */
function noPermEmbed() {
  return errorEmbed('You do not have permission to use this command.');
}

/**
 * Creates a loading embed.
 */
function loadingEmbed(message = 'Processing...') {
  return new EmbedBuilder()
    .setDescription(`⏳ ${message}`)
    .setColor(config.color)
    .setFooter({ text: config.footer });
}

module.exports = { createEmbed, successEmbed, errorEmbed, warningEmbed, infoEmbed, noPermEmbed, loadingEmbed };
