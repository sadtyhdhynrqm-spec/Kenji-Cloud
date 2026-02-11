const fs = require('fs-extra');
const path = require('path');
const { hasPermission } = require('../func/permissions');
const { checkCooldown } = require('../func/cooldown');
const { log } = require('../logger/logger');
const config = require('../config/config.json');

// تحميل جميع الأوامر
const loadCommands = () => {
  const commands = new Map();
  const commandPath = path.join(__dirname, '../modules/commands');
  const files = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

  for (const file of files) {
    try {
      const command = require(path.join(commandPath, file));
      commands.set(command.config.name, command);
      log('info', `تم تحميل الأمر: ${command.config.name}`);
    } catch (error) {
      log('error', `خطأ أثناء تحميل الأمر ${file}: ${error.message}`);
    }
  }

  return commands;
};

// تنفيذ الأمر
const handleCommand = async ({ message, args, event, api, Users, Threads, commands }) => {
  try {
    const threadData = Threads.get(event.threadID) || {};
    const prefixEnabled = threadData.settings?.prefixEnabled ?? config.prefixEnabled ?? true; 
    // إذا prefixEnabled = false، البوت يشتغل بدون بادئة

    let commandName;

    if (prefixEnabled) {
      // لو البادئة مفعلة، نفترض أن args[0] يحتوي على اسم الأمر
      if (!args || !args[0]) return;
      commandName = args[0].toLowerCase();
    } else {
      // بدون بادئة: ناخذ الكلمة الأولى في الرسالة كأمر
      if (!message.body) return;
      const words = message.body.trim().split(/\s+/);
      if (!words[0]) return;
      commandName = words[0].toLowerCase();
      args = words; // نحتفظ بكل الكلمات كـ args
    }

    const command = commands.get(commandName) || Array.from(commands.values()).find(cmd => cmd.config.aliases?.includes(commandName));
    if (!command) return; // الأمر غير موجود، لا يرسل شيء

    const userData = Users.get(event.senderID);
    if (userData && userData.isBanned) return; // المستخدم محظور

    // وضع الأدمن فقط
    if (global.client.config.adminOnlyMode && !hasPermission(event.senderID, { adminOnly: true })) {
      return api.sendMessage('انقلع/ي.', event.threadID);
    }

    // صلاحية الأمر
    if (!hasPermission(event.senderID, command.config, await api.getThreadInfo(event.threadID))) {
      return api.sendMessage('وزع يا فلاح .', event.threadID);
    }

    // كولداون (مدة الانتظار)
    if (global.client.config.features.cooldown && !checkCooldown(event.senderID, command.config.name, command.config.countDown)) {
      return api.sendMessage(`الرجاء الانتظار ${command.config.countDown} ثانية قبل استخدام هذا الأمر مرة أخرى.`, event.threadID);
    }

    // تنفيذ الأمر
    await command.onStart({ message, args: args.slice(1), event, api, Users, Threads, config: global.client.config });
    log('info', `تم تنفيذ الأمر: ${command.config.name} بواسطة المستخدم ${event.senderID}`);
  } catch (error) {
    log('error', `خطأ في تنفيذ الأمر: ${error.message}`);
    api.sendMessage('حدث خطأ أثناء تنفيذ الأمر.', event.threadID);
  }
};

module.exports = { loadCommands, handleCommand };
