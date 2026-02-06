const { Users } = require('../../database/database');

// دالة لتحويل الرقم العادي إلى أرقام مزخرفة ⓪①②...
function fancyNumber(num) {
    const fancyDigits = ['⓪','①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
    return num.toString().split('').map(d => fancyDigits[parseInt(d)]).join('');
}

module.exports = {
  config: {
    name: 'محظورين',
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    description: 'يعرض جميع المستخدمين المحظورين من البوت',
    category: 'أدوات',
    guide: {
      ar: '   {pn} - لعرض قائمة المحظورين'
    },
  },

  onStart: async ({ api, event }) => {
    try {
      const allUsers = Users.getAll(); 
      const bannedUsers = Object.values(allUsers).filter(user => user.isBanned);

      if (bannedUsers.length === 0) {
        return api.sendMessage('✅ لا يوجد مستخدمون محظورون حالياً.', event.threadID);
      }

      let banListMessage = '🚫 ══ 🌟 قائمة المستخدمين المحظورين 🌟 ══ 🚫\n\n';
      bannedUsers.forEach((user, index) => {
        const fancyIndex = fancyNumber(index + 1); // تحويل الرقم إلى مزخرف
        banListMessage += `💠 ${fancyIndex}. ${user.name} (UID: ${user.userID})\n`;
      });

      banListMessage += '\n⚠️ هذه القائمة تشمل فقط المستخدمين المحظورين من استخدام البوت.';

      api.sendMessage(banListMessage, event.threadID);

    } catch (error) {
      console.error("❌ خطأ في أمر قائمة الحظر:", error);
      api.sendMessage('❌ حدث خطأ أثناء جلب قائمة الحظر.', event.threadID);
    }
  },
};
