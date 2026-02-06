const { validateInput } = require('../../func/utils');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'عضو',
    version: '1.5',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    aliases: ['au', 'addu', 'اضافة'],
    description: '➕ إضافة عضو إلى شات المجموعة',
    category: 'box chat',
    guide: {
      en: '   {pn}اضافة_عضو [رابط الحساب | UID]'
    },
  },

  onStart: async ({ message, args, event, api, Users, Threads, config }) => {
    try {
      if (!args[0]) {
        return api.sendMessage(
          '❌ | يرجى إدخال UID العضو أو رابط حسابه.',
          event.threadID
        );
      }

      const userID = args[0].match(/\d+$/)?.[0] || args[0];
      if (!validateInput(userID)) {
        return api.sendMessage(
          '⚠️ | رقم المستخدم غير صالح.',
          event.threadID
        );
      }

      await api.addUserToGroup(userID, event.threadID, (err) => {
        if (err) {
          log('error', `Failed to add user ${userID}: ${err.message}`);
          return api.sendMessage(
            '🚫 | فشل إضافة العضو إلى المجموعة.',
            event.threadID
          );
        }

        api.sendMessage(
          `✅ | تم إضافة العضو بنجاح إلى المجموعة.`,
          event.threadID
        );

        log('info', `User ${userID} added to group ${event.threadID}`);
      });
    } catch (error) {
      log('error', `Adduser error: ${error.message}`);
      api.sendMessage(
        '❌ | حدث خطأ أثناء إضافة العضو.',
        event.threadID
      );
    }
  },
};
