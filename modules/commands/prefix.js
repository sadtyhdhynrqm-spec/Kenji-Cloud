const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'prefix',
    version: '1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: false, // يشتغل بدون بادئة
    description: 'يعرض بادئة النظام وبادئة المجموعة فقط',
    category: 'utility',
  },

  onStart: async ({ api, event, args }) => {
    try {
      const threadID = event.threadID;
      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};

      // بادئة المجموعة
      const groupPrefix = threadData.settings.prefix || '⧉⭅『』';

      // تغيير بادئة المجموعة
      if (args[0] === 'setprefix') {
        if (!event.isGroup)
          return api.sendMessage('❌ الأمر دا خاص بالمجموعات بس', threadID);

        if (!args[1])
          return api.sendMessage('⚠️ أرسل البادئة الجديدة', threadID);

        threadData.settings.prefix = args[1];
        Threads.set(threadID, threadData);

        return api.sendMessage(
          `✅ تم تغيير بادئة المجموعة إلى:\n⧉⭅『${args[1]}』`,
          threadID
        );
      }

      // بادئة النظام
      const systemPrefix = global.client.config.prefix || '⧉⭅『』';

      const message =
        `⧉⭅『 معلومات البادئة 』⧉⭅\n\n` +
        `⚙️ بادئة النظام : ⧉⭅『${systemPrefix}』\n` +
        `👥 بادئة المجموعة : ⧉⭅『${groupPrefix}』`;

      api.sendMessage(message, threadID);

    } catch (err) {
      console.error('خطأ في أمر prefix:', err);
      api.sendMessage('❌ حصل خطأ أثناء تنفيذ الأمر', event.threadID);
    }
  }
};
