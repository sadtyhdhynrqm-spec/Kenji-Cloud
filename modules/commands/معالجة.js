const fs = require('fs-extra');

const DEVELOPER_ID = '61586897962846'; // إيديك كمطور

module.exports = {
  config: {
    name: 'معالجة',
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'تشغيل أو إيقاف وضع المشرف فقط.',
    category: 'admin',
    guide: {
      en: '{pn}معالجة [تشغيل | ايقاف]',
    },
  },

  onStart: async ({ api, event, args, globalConfig }) => {
    try {
      // حماية: السماح لك فقط
      if (event.senderID !== DEVELOPER_ID) {
        return api.sendMessage(
          '❌ هذا الأمر خاص بالمطور فقط.',
          event.threadID
        );
      }

      // حالة الاستعلام فقط
      if (!args.length) {
        return api.sendMessage(
          `الحالة الحالية: ${global.client.config.adminOnlyMode ? 'مفعل ✅' : 'مطفأ ❌'}`,
          event.threadID
        );
      }

      const state = args[0].toLowerCase();
      if (!['تشغيل', 'ايقاف'].includes(state)) {
        return api.sendMessage('استخدم: تشغيل أو ايقاف', event.threadID);
      }

      // ضبط الوضع
      const newState = state === 'تشغيل';
      global.client.config.adminOnlyMode = newState;

      // حفظ الإعدادات
      fs.writeJsonSync('./config/config.json', global.client.config, { spaces: 2 });

      // تفاعل في رسالة المطور فقط
      const emoji = newState ? '✅' : '❌';
      api.addReaction(emoji, event.messageID, (err) => {
        if (err) console.error('Failed to react:', err);
      });

      // رسالة للمجموعة توضح التغيير للأعضاء
      api.sendMessage(
        `تم تغيير وضع معالجة: ${newState ? 'مفعل ✅' : 'مطفأ ❌'}`,
        event.threadID
      );

    } catch (error) {
      console.error("Error in adminonly command:", error);
      api.sendMessage('حصل خطأ أثناء تغيير الوضع.', event.threadID);
    }
  },
};
