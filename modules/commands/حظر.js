const { Users } = require('../../database/database');

module.exports = {
  config: {
    name: 'حظر',
    version: '1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'حظر أو فك حظر مستخدم من استخدام أوامر البوت',
    category: 'الإدارة',
    guide: {
      ar: '   {pn} [ايدي | منشن]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let targetUID;

      // الحصول على UID من المنشن أو الآرجومنت
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetUID = Object.keys(event.mentions)[0];
      } else if (args.length > 0) {
        targetUID = args[0];
      } else {
        return api.sendMessage(
          '⚠️ يرجى تحديد آيدي المستخدم أو عمل منشن له.',
          event.threadID
        );
      }

      const userData = Users.get(targetUID);
      if (!userData) {
        return api.sendMessage(
          '❌ المستخدم غير موجود في قاعدة البيانات.',
          event.threadID
        );
      }

      // التحقق من حالة الحظر
      if (userData.isBanned) {
        // فك الحظر
        userData.isBanned = false;
        Users.set(targetUID, userData);
        return api.sendMessage(
          `✅ تم فك حظر المستخدم بنجاح.\n🆔 الآيدي: ${targetUID}`,
          event.threadID
        );
      } else {
        // الحظر
        userData.isBanned = true;
        Users.set(targetUID, userData);
        return api.sendMessage(
          `🚫 تم حظر المستخدم بنجاح ومنعه من استخدام أوامر البوت.\n🆔 الآيدي: ${targetUID}`,
          event.threadID
        );
      }

    } catch (error) {
      console.error('خطأ في أمر الحظر:', error);
      api.sendMessage(
        '❌ حدث خطأ أثناء تنفيذ أمر الحظر/فك الحظر.',
        event.threadID
      );
    }
  },
};
