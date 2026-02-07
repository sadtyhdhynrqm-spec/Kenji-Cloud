const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'بادئة', // اسم الأمر الجديد
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'يضبط بادئة مخصصة للمجموعة الحالية أو يعمل بدون بادئة.',
    category: 'group',
    guide: {
      en: '   {pn} [البادئة_الجديدة] أو اتركها فارغة للعمل بدون بادئة'
    },
  },
  onStart: async ({ api, event, args }) => {
    try {
      // لو لم يدخل المستخدم أي بادئة، سيتم العمل بدون بادئة
      let newPrefix = args[0] || '';

      const threadData = Threads.get(event.threadID);
      if (!threadData) {
        return api.sendMessage('تعذر العثور على بيانات المجموعة.', event.threadID);
      }

      threadData.settings.prefix = newPrefix;
      Threads.set(event.threadID, threadData);

      if (newPrefix === '') {
        api.sendMessage('تم ضبط البوت للعمل **بدون بادئة** لهذه المجموعة.', event.threadID);
      } else {
        api.sendMessage(`تم ضبط البادئة لهذه المجموعة لتصبح: '${newPrefix}'.`, event.threadID);
      }

    } catch (error) {
      console.error("خطأ في أمر تعيين البادئة:", error);
      api.sendMessage('حدث خطأ أثناء ضبط البادئة.', event.threadID);
    }
  },
};
