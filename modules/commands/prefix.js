const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'prefix',
    version: '2.0',
    author: 'Hridoy + Modified by Abu Ubaida',
    countDown: 5,
    prefix: false, // يشتغل بدون بادئة
    description: 'إدارة وعرض بادئة النظام والمجموعة',
    category: 'utility',
  },

  onStart: async ({ api, event, args }) => {
    try {
      const threadID = event.threadID;
      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};

      const systemPrefix = global.client.config.prefix || '';
      const groupPrefix = threadData.settings.prefix ?? systemPrefix;

      // ===============================
      // تغيير بادئة المجموعة
      // ===============================
      if (args[0] === 'setprefix') {

        if (!event.isGroup)
          return api.sendMessage('❌ الأمر دا خاص بالمجموعات بس', threadID);

        if (!args[1])
          return api.sendMessage('⚠️ أرسل البادئة الجديدة\nمثال:\nprefix setprefix $', threadID);

        const newPrefix = args[1];

        threadData.settings.prefix = newPrefix;
        Threads.set(threadID, threadData);

        return api.sendMessage(
          `✅ تم تغيير بادئة المجموعة إلى:\n『 ${newPrefix} 』`,
          threadID
        );
      }

      // ===============================
      // تفعيل / تعطيل العمل بدون بادئة
      // ===============================
      if (args[0] === 'noprefix') {

        if (!event.isGroup)
          return api.sendMessage('❌ الأمر دا خاص بالمجموعات بس', threadID);

        const status = args[1];

        if (status !== 'on' && status !== 'off')
          return api.sendMessage('⚠️ استخدم:\nprefix noprefix on\nأو\nprefix noprefix off', threadID);

        threadData.settings.noPrefix = status === 'on';
        Threads.set(threadID, threadData);

        return api.sendMessage(
          status === 'on'
            ? '✅ تم تفعيل العمل بدون بادئة لهذه المجموعة'
            : '❌ تم إيقاف العمل بدون بادئة',
          threadID
        );
      }

      // ===============================
      // عرض المعلومات
      // ===============================
      const message =
        `⧉⭅『 معلومات البادئة 』⧉⭅\n\n` +
        `⚙️ بادئة النظام : 『 ${systemPrefix || 'لا يوجد'} 』\n` +
        `👥 بادئة المجموعة : 『 ${groupPrefix || 'لا يوجد'} 』\n` +
        `🚀 العمل بدون بادئة : ${threadData.settings.noPrefix ? 'مفعل ✅' : 'غير مفعل ❌'}`;

      return api.sendMessage(message, threadID);

    } catch (err) {
      console.error('خطأ في أمر prefix:', err);
      return api.sendMessage('❌ حصل خطأ أثناء تنفيذ الأمر', event.threadID);
    }
  }
};
