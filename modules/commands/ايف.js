const fs = require('fs');
const path = require('path');

const DEV_ID = '61586897962846'; // ايدي المطور
const COMMANDS_PATH = __dirname; // عدل لو مجلد الأوامر مختلف

let fileCache = {};

module.exports = {
  config: {
    name: 'ايف',
    version: '4.0',
    author: 'Hridoy | Modified by Abu Ubaida',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'مدير ملفات الأوامر المتكامل (للمطور فقط)',
    category: 'owner',
    guide: {
      ar:
        '{pn} → عرض الملفات\n' +
        '{pn} <رقم> → عرض محتوى ملف\n' +
        '{pn} انشئ <اسم> (رد على كود)\n' +
        '{pn} استبدل <اسم> (رد على كود)\n' +
        '{pn} حذف <اسم>\n' +
        '{pn} ريـلود <اسم>'
    }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    if (senderID !== DEV_ID)
      return api.sendMessage('❌ الأمر خاص بالمطور فقط.', threadID, messageID);

    const files = fs.readdirSync(COMMANDS_PATH).filter(f => f.endsWith('.js'));

    // =========================
    // عرض كل الملفات
    // =========================
    if (!args[0]) {
      if (files.length === 0)
        return api.sendMessage('❌ لا توجد ملفات.', threadID, messageID);

      let msg = '📂 ملفات الأوامر:\n\n';
      files.forEach((file, index) => {
        msg += `${index + 1}️⃣ ${file}\n`;
      });

      fileCache[threadID] = files;
      return api.sendMessage(msg, threadID, messageID);
    }

    // =========================
    // عرض محتوى ملف برقم
    // =========================
    if (!isNaN(args[0])) {
      const index = parseInt(args[0]) - 1;

      if (!fileCache[threadID] || !fileCache[threadID][index])
        return api.sendMessage('❌ رقم غير صحيح.', threadID, messageID);

      const fileName = fileCache[threadID][index];
      const filePath = path.join(COMMANDS_PATH, fileName);
      const content = fs.readFileSync(filePath, 'utf8');

      return api.sendMessage(
        `📄 ${fileName}\n\n${content.substring(0, 15000)}`,
        threadID,
        messageID
      );
    }

    const action = args[0];
    const commandName = args[1];
    const filePath = path.join(COMMANDS_PATH, `${commandName}.js`);

    // =========================
    // إنشاء أمر جديد
    // =========================
    if (action === 'انشئ') {
      if (!event.messageReply?.body)
        return api.sendMessage('❌ لازم ترد على رسالة فيها كود الأمر.', threadID, messageID);

      if (!commandName)
        return api.sendMessage('❌ اكتب اسم الأمر.', threadID, messageID);

      if (fs.existsSync(filePath))
        return api.sendMessage('❌ الملف موجود مسبقاً.', threadID, messageID);

      fs.writeFileSync(filePath, event.messageReply.body, 'utf8');

      return api.sendMessage(
        `✅ تم إنشاء الأمر ${commandName}.js\n♻️ يفضل إعادة تشغيل البوت.`,
        threadID,
        messageID
      );
    }

    // =========================
    // استبدال أمر
    // =========================
    if (action === 'استبدل') {
      if (!event.messageReply?.body)
        return api.sendMessage('❌ لازم ترد على رسالة فيها الكود الجديد.', threadID, messageID);

      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      fs.writeFileSync(filePath, event.messageReply.body, 'utf8');

      return api.sendMessage(
        `✅ تم استبدال ${commandName}.js بنجاح.`,
        threadID,
        messageID
      );
    }

    // =========================
    // حذف أمر
    // =========================
    if (action === 'حذف') {
      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      fs.unlinkSync(filePath);

      return api.sendMessage(
        `🗑 تم حذف ${commandName}.js`,
        threadID,
        messageID
      );
    }

    // =========================
    // ريـلود أمر
    // =========================
    if (action === 'ريلود') {
      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      delete require.cache[require.resolve(filePath)];

      try {
        require(filePath);
        return api.sendMessage(`🔄 تم إعادة تحميل ${commandName}.js بنجاح.`, threadID, messageID);
      } catch (err) {
        return api.sendMessage(`❌ خطأ في الكود:\n${err.message}`, threadID, messageID);
      }
    }

    return api.sendMessage('❌ أمر غير معروف.', threadID, messageID);
  }
};
