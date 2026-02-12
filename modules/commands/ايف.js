const fs = require('fs');
const path = require('path');

const DEV_ID = '61586897962846'; // ايدي المطور
const COMMANDS_PATH = path.join(__dirname); // عدل لو مجلد الأوامر مختلف

// تخزين مؤقت للملفات المعروضة
let fileCache = {};

module.exports = {
  config: {
    name: 'ايف',
    version: '3.0',
    author: 'Hridoy | Modified by Abu Ubaida',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'مدير ملفات الأوامر للمطور فقط',
    category: 'owner',
    guide: {
      ar:
        '{pn} → عرض الملفات\n' +
        '{pn} <رقم> → عرض محتوى ملف\n' +
        'الرد على كود + {pn} استبدل <اسم_الامر>'
    }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    if (senderID !== DEV_ID) {
      return api.sendMessage('❌ الأمر خاص بالمطور فقط.', threadID, messageID);
    }

    const files = fs.readdirSync(COMMANDS_PATH).filter(f => f.endsWith('.js'));

    // ==============================
    // 1️⃣ عرض كل الملفات
    // ==============================
    if (!args[0]) {
      if (files.length === 0)
        return api.sendMessage('❌ لا توجد ملفات.', threadID, messageID);

      let msg = '📂 ملفات الأوامر:\n\n';
      files.forEach((file, index) => {
        msg += `${index + 1}️⃣ ${file}\n`;
      });

      // حفظهم مؤقتاً
      fileCache[threadID] = files;

      return api.sendMessage(msg, threadID, messageID);
    }

    // ==============================
    // 2️⃣ عرض محتوى ملف برقم
    // ==============================
    if (!isNaN(args[0])) {
      const index = parseInt(args[0]) - 1;

      if (!fileCache[threadID] || !fileCache[threadID][index]) {
        return api.sendMessage('❌ رقم غير صحيح.', threadID, messageID);
      }

      const fileName = fileCache[threadID][index];
      const filePath = path.join(COMMANDS_PATH, fileName);

      const content = fs.readFileSync(filePath, 'utf8');

      return api.sendMessage(
        `📄 محتوى الملف: ${fileName}\n\n${content.substring(0, 15000)}`,
        threadID,
        messageID
      );
    }

    // ==============================
    // 3️⃣ استبدال ملف
    // ==============================
    if (args[0] === 'استبدل') {
      if (!event.messageReply || !event.messageReply.body) {
        return api.sendMessage(
          '❌ لازم ترد على رسالة تحتوي على الكود الجديد.',
          threadID,
          messageID
        );
      }

      const commandName = args[1];
      if (!commandName) {
        return api.sendMessage(
          '❌ اكتب اسم الأمر.\nمثال:\nايف استبدل help',
          threadID,
          messageID
        );
      }

      const filePath = path.join(COMMANDS_PATH, `${commandName}.js`);

      if (!fs.existsSync(filePath)) {
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);
      }

      const newCode = event.messageReply.body;

      fs.writeFileSync(filePath, newCode, 'utf8');

      return api.sendMessage(
        `✅ تم استبدال ملف ${commandName}.js بنجاح.\n\n♻️ يفضل إعادة تشغيل البوت.`,
        threadID,
        messageID
      );
    }

    return api.sendMessage('❌ أمر غير معروف.', threadID, messageID);
  }
};
