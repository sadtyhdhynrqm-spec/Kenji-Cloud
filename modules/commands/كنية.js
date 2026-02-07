module.exports = {
  config: {
    name: 'كنية',
    version: '1.5',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'تعيين أو حذف كنية (بالرد، المنشن، أو على نفسك)',
    category: 'group',
    guide: {
      ar: '   {pn} [بالرد | @منشن] [كنية جديدة]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let targetID;
      let newNickname = '';
      const botID = api.getCurrentUserID();

      // 1️⃣ بالرد (أولوية)
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
        newNickname = args.join(' ');
      }
      // 2️⃣ بالمنشن
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
        newNickname = args.slice(1).join(' ');
      }
      // 3️⃣ بدون رد ولا منشن → على نفسو
      else {
        targetID = event.senderID;
        newNickname = args.join(' ');
      }

      // 🟡 لو المنشن كان البوت → امسح كنية الكاتب نفسو
      if (targetID === botID) {
        targetID = event.senderID;
        newNickname = '';
      }

      api.changeNickname(newNickname, event.threadID, targetID, (err) => {
        if (err) {
          console.error('Failed to change nickname:', err);
          api.sendMessage(
            '⚠️ ما قدرت أغيّر الكنية، اتأكد إنو البوت مشرف.',
            event.threadID
          );
        }
      });

    } catch (error) {
      console.error('Error in nickname command:', error);
      api.sendMessage(
        '⚠️ حصلت مشكلة أثناء تنفيذ الأمر.',
        event.threadID
      );
    }
  },
};
