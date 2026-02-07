const { Users, Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'prefix',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: false, // يشتغل بدون بادئة
    description: 'يعرض البادئة الخاصة بالبوت والمجموعة، وعدد المستخدمين والمجموعات.',
    category: 'utility',
    guide: {
      en: '   {pn} [show/setprefix]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const threadID = event.threadID;
      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};

      // البادئة الحالية (يمكن أن تكون فارغة)
      const groupPrefix = threadData.settings.prefix || '';

      // أمر لتغيير البادئة
      if (args[0] === 'setprefix') {
        if (!event.isGroup) return api.sendMessage('هذا الأمر خاص بالمجموعات فقط.', threadID);
        if (!args[1]) return api.sendMessage('أرسل البادئة الجديدة.', threadID);

        // تحديث البادئة
        threadData.settings.prefix = args[1];
        Threads.set(threadID, threadData);

        return api.sendMessage(`تم تغيير البادئة للمجموعة إلى: ${args[1] || 'فارغة (بدون بادئة)'}`, threadID);
      }

      // عرض معلومات البوت والبادئة
      const botPrefix = global.client.config.prefix || '';
      const totalUsers = Object.keys(Users.getAll()).length;
      const totalThreads = Object.keys(Threads.getAll()).length;

      const message = `--- معلومات البوت ---\n` +
                      `بادئة البوت: ${botPrefix || 'فارغة (بدون بادئة)'}\n` +
                      `بادئة المجموعة: ${groupPrefix || 'فارغة (بدون بادئة)'}\n` +
                      `إجمالي المستخدمين: ${totalUsers}\n` +
                      `إجمالي المجموعات: ${totalThreads}\n\n` +
                      `لتغيير البادئة: ${groupPrefix || 'فارغة'} setprefix [البادئة الجديدة]`;

      api.sendMessage(message, threadID);

    } catch (error) {
      console.error("حدث خطأ في أمر البادئة:", error);
      api.sendMessage('حدث خطأ أثناء جلب معلومات البادئة.', event.threadID);
    }
  }
};
