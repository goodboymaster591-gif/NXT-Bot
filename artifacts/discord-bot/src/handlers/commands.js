/**
 * Command handler — recursively loads all command files from src/commands/
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.js');

module.exports = (client) => {
  client.commands = new Map();

  const commandsPath = path.join(__dirname, '../commands');

  function loadDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        loadDir(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          const command = require(fullPath);
          if (!command.data || !command.execute) {
            logger.warn(`Skipping ${entry.name} — missing data or execute`);
            continue;
          }
          client.commands.set(command.data.name, command);
          logger.info(`Loaded command: /${command.data.name}`);
        } catch (err) {
          logger.error(`Failed to load ${entry.name}: ${err.message}`);
        }
      }
    }
  }

  loadDir(commandsPath);
  logger.success(`Loaded ${client.commands.size} commands`);
};
