const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'معالجة',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'تشغيل أو إيقاف وضع المشرف فقط.',
    category: 'admin',
    guide: {
      en: '   {pn}معالجة [تشغيل | ايقاف]',
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      if (args.length === 0) {
        return api.sendMessage(
          `الحالة الحالية: ${global.client.config.adminOnlyMode ? 'مفعل' : 'مطفأ'}`,
          event.threadID
        );
      }

      const state = args[0].toLowerCase();
      if (!['true', 'false', 'تشغيل', 'ايقاف'].includes(state)) {
        return api.sendMessage(
          'استخدم: تشغيل أو ايقاف',
          event.threadID
        );
      }

      global.client.config.adminOnlyMode =
        (state === 'true' || state === 'تشغيل');

      fs.writeJsonSync('./config/config.json', global.client.config, { spaces: 2 });

      api.sendMessage(
        `تم التغيير: ${global.client.config.adminOnlyMode ? 'مفعل' : 'مطفأ'}`,
        event.threadID
      );

    } catch (error) {
      console.error("Error in adminonly command:", error);
      api.sendMessage(
        'حصل خطأ.',
        event.threadID
      );
    }
  },
};
