const { isOwner } = require('../../func/permissions');
const { log } = require('../../logger/logger');
const fs = require('fs-extra'); 

module.exports = {
  config: {
    name: 'مشرف',
    version: '1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    aliases: ['adm', 'ادمن'],
    description: '⚙️ إدارة صلاحيات المشرفين',
    category: 'admin',
    guide: {
      en: '   {pn}مشرف [اضافة | ازالة] [UID | @منشن]'
    },
  },

  onStart: async ({ message, args, event, api }) => {
    try {
      if (!isOwner(event.senderID)) {
        return api.sendMessage(
          '🚫 | هذا الأمر مخصص لمالك البوت فقط.',
          event.threadID
        );
      }

      if (args.length < 1) {
        return api.sendMessage(
          '📌 | الاستخدام: !مشرف [اضافة | ازالة] [UID | @منشن]',
          event.threadID
        );
      }

      const action = args[0].toLowerCase();
      let targetUID;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetUID = Object.keys(event.mentions)[0]; 
      } else if (args.length > 1) {
        targetUID = args[1];
      } else {
        return api.sendMessage(
          '❌ | يرجى كتابة UID العضو أو منشنته.',
          event.threadID
        );
      }

      if (!['add', 'remove', 'اضافة', 'ازالة'].includes(action)) {
        return api.sendMessage(
          '⚠️ | أمر غير صالح، استخدم (اضافة) أو (ازالة).',
          event.threadID
        );
      }

      const currentConfig = global.client.config;

      if (action === 'add' || action === 'اضافة') {
        if (currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage(
            'ℹ️ | هذا العضو مشرف بالفعل.',
            event.threadID
          );
        }

        currentConfig.adminUIDs.push(targetUID);
        fs.writeJsonSync('./config/config.json', currentConfig, { spaces: 2 });

        api.sendMessage(
          `✅ | تم ترقية العضو إلى مشرف بنجاح.`,
          event.threadID
        );
        log('info', `Admin added: ${targetUID}`);

      } else { 
        if (!currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage(
            'ℹ️ | هذا العضو ليس مشرفًا.',
            event.threadID
          );
        }

        currentConfig.adminUIDs = currentConfig.adminUIDs.filter(id => id !== targetUID);
        fs.writeJsonSync('./config/config.json', currentConfig, { spaces: 2 });

        api.sendMessage(
          `🗑️ | تم إزالة العضو من قائمة المشرفين.`,
          event.threadID
        );
        log('info', `Admin removed: ${targetUID}`);
      }
    } catch (error) {
      log('error', `Admin command error: ${error.message}`);
      api.sendMessage(
        '❌ | حدث خطأ أثناء إدارة صلاحيات المشرفين.',
        event.threadID
      );
    }
  },
};
