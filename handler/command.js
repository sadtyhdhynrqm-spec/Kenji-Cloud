const fs = require('fs-extra');
const path = require('path');
const { hasPermission } = require('../func/permissions');
const { checkCooldown } = require('../func/cooldown');
const { log } = require('../logger/logger');
const { Threads } = require('../database/database');

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

const handleCommand = async ({ message, event, api, Users, Threads, commands }) => {
  try {
    const threadID = event.threadID;
    const senderID = event.senderID;

    const body = event.body || '';

    // ===============================
    // 📌 بيانات القروب
    // ===============================
    const threadData = Threads.get(threadID) || {};
    threadData.settings = threadData.settings || {};

    const systemPrefix = global.client.config.prefix || '';
    const groupPrefix = threadData.settings.prefix ?? systemPrefix;
    const noPrefixEnabled = threadData.settings.noPrefix ?? false;

    let commandName;
    let commandArgs = [];

    // ===============================
    // 🟢 لو الرسالة بدأت ببادئة
    // ===============================
    if (groupPrefix && body.startsWith(groupPrefix)) {
      const sliced = body
        .slice(groupPrefix.length)
        .trim()
        .split(/\s+/);

      commandName = sliced[0]?.toLowerCase();
      commandArgs = sliced.slice(1);
    }

    // ===============================
    // 🟢 لو مافي بادئة ومفعل noprefix
    // ===============================
    else if (noPrefixEnabled) {
      const sliced = body.trim().split(/\s+/);

      commandName = sliced[0]?.toLowerCase();
      commandArgs = sliced.slice(1);
    }

    if (!commandName) return;

    // ===============================
    // 🔍 البحث عن الأمر
    // ===============================
    const command =
      commands.get(commandName) ||
      Array.from(commands.values()).find(cmd =>
        cmd.config.aliases?.includes(commandName)
      );

    if (!command) return;

    // ===============================
    // ❌ لو الأمر يتطلب بادئة وما جات ببادئة
    // ===============================
    if (command.config.prefix !== false) {
      if (!body.startsWith(groupPrefix)) return;
    }

    // ===============================
    // 🚫 تحقق الحظر
    // ===============================
    const userData = Users.get(senderID);
    if (userData && userData.isBanned) return;

    // ===============================
    // 🔐 admin only mode
    // ===============================
    if (
      global.client.config.adminOnlyMode &&
      !hasPermission(senderID, { adminOnly: true })
    ) {
      return api.sendMessage(
        'Bot is currently in admin-only mode. Only bot administrators can use commands.',
        threadID
      );
    }

    // ===============================
    // 🔑 تحقق الصلاحيات
    // ===============================
    if (
      !hasPermission(
        senderID,
        command.config,
        await api.getThreadInfo(threadID)
      )
    ) {
      return api.sendMessage(
        'You do not have permission to use this command.',
        threadID
      );
    }

    // ===============================
    // ⏳ تحقق الكولداون
    // ===============================
    if (
      global.client.config.features?.cooldown &&
      !checkCooldown(senderID, command.config.name, command.config.countDown)
    ) {
      return api.sendMessage(
        `Please wait ${command.config.countDown} seconds before using this command again.`,
        threadID
      );
    }

    // ===============================
    // 🚀 تنفيذ الأمر
    // ===============================
    await command.onStart({
      message,
      args: commandArgs,
      event,
      api,
      Users,
      Threads,
      config: global.client.config
    });

    log('info', `Command executed: ${command.config.name} by user ${senderID}`);

  } catch (error) {
    log('error', `Command error: ${error.message}`);
    api.sendMessage(
      'An error occurred while executing the command.',
      event.threadID
    );
  }
};

module.exports = { loadCommands, handleCommand };
