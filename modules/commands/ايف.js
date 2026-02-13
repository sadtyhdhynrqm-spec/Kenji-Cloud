const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEV_ID = '61586897962846';
const COMMANDS_PATH = path.join(process.cwd(), 'commands');

let fileCache = {};

function autoInstallPackages(code, api, threadID) {
  const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
  let match;
  const packages = new Set();

  while ((match = requireRegex.exec(code)) !== null) {
    const pkg = match[1];

    if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
      packages.add(pkg.split('/')[0]);
    }
  }

  packages.forEach(pkg => {
    try {
      require.resolve(pkg);
    } catch {
      try {
        api.sendMessage(`📦 جاري تثبيت ${pkg} تلقائياً...`, threadID);
        execSync(`npm install ${pkg}`, { stdio: 'inherit' });
        api.sendMessage(`✅ تم تثبيت ${pkg}`, threadID);
      } catch (err) {
        api.sendMessage(`❌ فشل تثبيت ${pkg}\n${err.message}`, threadID);
      }
    }
  });
}

module.exports = {
  config: {
    name: 'ايف',
    version: '5.1',
    author: 'Hridoy | Modified by Abu Ubaida',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'مدير ملفات متكامل + تثبيت تلقائي (للمطور فقط)',
    category: 'owner',
    guide: {
      ar:
        '{pn} → عرض الملفات\n' +
        '{pn} <رقم> → عرض محتوى ملف\n' +
        '{pn} انشئ <اسم> (رد على كود)\n' +
        '{pn} استبدل <اسم> (رد على كود)\n' +
        '{pn} حذف <اسم>\n' +
        '{pn} ريـلود <اسم>\n' +
        '⚡ التثبيت يتم تلقائياً عند الانشاء أو الاستبدال'
    }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    if (senderID !== DEV_ID)
      return api.sendMessage('❌ الأمر خاص بالمطور فقط.', threadID, messageID);

    if (!fs.existsSync(COMMANDS_PATH))
      return api.sendMessage('❌ مجلد الأوامر غير موجود.', threadID, messageID);

    const files = fs.readdirSync(COMMANDS_PATH).filter(f => f.endsWith('.js'));

    // عرض الملفات
    if (!args[0]) {
      if (!files.length)
        return api.sendMessage('❌ لا توجد ملفات.', threadID, messageID);

      let msg = '📂 ملفات الأوامر:\n\n';
      files.forEach((file, i) => {
        msg += `${i + 1}️⃣ ${file}\n`;
      });

      fileCache[threadID] = files;
      return api.sendMessage(msg, threadID, messageID);
    }

    // عرض محتوى برقم
    if (!isNaN(args[0])) {
      const index = parseInt(args[0]) - 1;

      if (!fileCache[threadID] || !fileCache[threadID][index])
        return api.sendMessage('❌ رقم غير صحيح.', threadID, messageID);

      const fileName = fileCache[threadID][index];
      const content = fs.readFileSync(
        path.join(COMMANDS_PATH, fileName),
        'utf8'
      );

      return api.sendMessage(
        `📄 ${fileName}\n\n${content.substring(0, 15000)}`,
        threadID,
        messageID
      );
    }

    const action = args[0];
    const name = args[1];

    if (!name)
      return api.sendMessage('❌ اكتب اسم الأمر.', threadID, messageID);

    const filePath = path.join(COMMANDS_PATH, `${name}.js`);

    // إنشاء
    if (action === 'انشئ') {
      if (!event.messageReply?.body)
        return api.sendMessage('❌ لازم ترد على كود.', threadID, messageID);

      if (fs.existsSync(filePath))
        return api.sendMessage('❌ الملف موجود.', threadID, messageID);

      const code = event.messageReply.body;

      autoInstallPackages(code, api, threadID);
      fs.writeFileSync(filePath, code, 'utf8');

      return api.sendMessage(
        `✅ تم إنشاء ${name}.js\n🚀 المكتبات تم تثبيتها تلقائياً`,
        threadID,
        messageID
      );
    }

    // استبدال
    if (action === 'استبدل') {
      if (!event.messageReply?.body)
        return api.sendMessage('❌ لازم ترد على كود.', threadID, messageID);

      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      const code = event.messageReply.body;

      autoInstallPackages(code, api, threadID);
      fs.writeFileSync(filePath, code, 'utf8');

      return api.sendMessage(
        `✅ تم استبدال ${name}.js\n🚀 تم تحديث المكتبات تلقائياً`,
        threadID,
        messageID
      );
    }

    if (action === 'حذف') {
      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      fs.unlinkSync(filePath);
      return api.sendMessage(`🗑 تم حذف ${name}.js`, threadID, messageID);
    }

    if (action === 'ريلود') {
      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      try {
        delete require.cache[require.resolve(filePath)];
        require(filePath);
        return api.sendMessage(`🔄 تم إعادة تحميل ${name}.js`, threadID, messageID);
      } catch (err) {
        return api.sendMessage(`❌ خطأ:\n${err.message}`, threadID, messageID);
      }
    }

    return api.sendMessage('❌ أمر غير معروف.', threadID, messageID);
  }
};
