const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'ملف',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'إرسال ملف الأمر المحدد كرسالة.',
    category: 'Group',
    guide: {
      en: '   {pn} [اسم_الأمر]'
    },
  },
  onStart: async ({ message, args, event, api }) => {
    try {
      if (args.length < 1) {
        return api.sendMessage('❌ الاستخدام: !ملف [اسم_الأمر]', event.threadID);
      }

      const commandName = args[0].toLowerCase();
      const commandPath = path.join(__dirname, `${commandName}.js`);

      if (fs.existsSync(commandPath)) {
        const fileContent = fs.readFileSync(commandPath, 'utf8');
        api.sendMessage({ body: `javascript\n${fileContent}\n` }, event.threadID);
      } else {
        api.sendMessage(`❌ لم يتم العثور على الأمر '${commandName}'.`, event.threadID);
      }
    } catch (error) {
      console.log(error);
      api.sendMessage('❌ حدث خطأ أثناء جلب ملف الأمر.', event.threadID);
    }
  },
};
