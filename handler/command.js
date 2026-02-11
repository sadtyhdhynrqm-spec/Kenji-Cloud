const fs = require('fs-extra');
const path = require('path');
const { hasPermission } = require('../func/permissions');
const { checkCooldown } = require('../func/cooldown');
const { log } = require('../logger/logger');
const config = require('../config/config.json');

const loadCommands = () => {
  const commands = new Map();
  const commandPath = path.join(__dirname, '../modules/commands');
  const files = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
  for (const file of files) {
    try {
      const command = require(path.join(commandPath, file));
      commands.set(command.config.name, command);
      log('info', `Loaded command: ${command.config.name}`);
    } catch (error) {
      log('error', `Error loading command ${file}: ${error.message}`);
    }
  }
  return commands;
};

const handleCommand = async ({ message, args, event, api, Users, Threads, commands }) => {
  try {
    
    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName) || Array.from(commands.values()).find(cmd => cmd.config.aliases?.includes(commandName));
    if (!command) return;


    const userData = Users.get(event.senderID);
    if (userData && userData.isBanned) {
      return; 
    }

    
    if (global.client.config.adminOnlyMode && !hasPermission(event.senderID, { adminOnly: true })) {
      return api.sendMessage('Bot is currently in admin-only mode. Only bot administrators can use commands.', event.threadID);
    }

    if (!hasPermission(event.senderID, command.config, await api.getThreadInfo(event.threadID))) {
      return api.sendMessage('You do not have permission to use this command.', event.threadID);
    }

    if (global.client.config.features.cooldown && !checkCooldown(event.senderID, command.config.name, command.config.countDown)) {
      return api.sendMessage(`Please wait ${command.config.countDown} seconds before using this command again.`, event.threadID);
    }

    await command.onStart({ message, args: args.slice(1), event, api, Users, Threads, config: global.client.config });
    log('info', `Command executed: ${command.config.name} by user ${event.senderID}`);
  } catch (error) {
    log('error', `Command error: ${error.message}`);
    api.sendMessage('An error occurred while executing the command.', event.threadID);
  }
};

module.exports = { loadCommands, handleCommand };
