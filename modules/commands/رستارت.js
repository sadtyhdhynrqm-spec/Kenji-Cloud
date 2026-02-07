const fs = require('fs');

module.exports = {
  config: {
    name: 'رستارت', // تغيير اسم الأمر للعربي
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'إعادة تشغيل البوت وعرض رسالة عند إعادة التشغيل.',
    category: 'admin',
    guide: {
      en: '{pn}'
    },
  },

  onStart: async ({ message, event, api, config }) => {
    try {
      const restartInfo = {
        startTime: Date.now(),
        threadID: event.threadID
      };
      fs.writeFileSync('./restart.json', JSON.stringify(restartInfo));

      api.sendMessage(`🔄 جاري إعادة تشغيل ${config.botName}...`, event.threadID, () => {
        process.exit(2); 
      });

    } catch (error) {
      console.log(error);
    }
  },

  onLoad: async ({ api }) => {
    // تحقق من وجود ملف restart.json لإرسال رسالة بعد إعادة التشغيل
    if (fs.existsSync('./restart.json')) {
      try {
        const data = JSON.parse(fs.readFileSync('./restart.json', 'utf8'));
        const { threadID } = data;

        await api.sendMessage('ابلين رستارت دن 🌼✅', threadID);

        fs.unlinkSync('./restart.json'); // حذف الملف بعد الإرسال
      } catch (err) {
        console.error('خطأ عند إرسال رسالة إعادة التشغيل:', err);
      }
    }
  }
};
