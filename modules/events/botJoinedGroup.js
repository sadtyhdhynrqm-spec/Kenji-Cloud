module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '1.3',
    author: 'Hridoy + Fix by ChatGPT',
    description: 'Sets bot nickname and sends fancy welcome message when added to a group.',
    eventType: ['log:subscribe'],
  },

  onStart: async ({ api, event }) => {
    try {
      const { Threads } = require('../../database/database');

      const botID = api.getCurrentUserID();
      const addedParticipants = event.logMessageData?.addedParticipants || [];

      console.log('[JOIN EVENT] Bot ID:', botID);
      console.log('[JOIN EVENT] Added:', addedParticipants);

      // تحقق إذا البوت اتضاف
      const isBotAdded = addedParticipants.some(
        user => user.userFbId === botID
      );

      if (!isBotAdded) return;

      // إنشاء بيانات القروب
      await Threads.create(event.threadID, 'New Group');

      const botName = global.client.config.botName || 'Kenji Cloud';
      const prefix = global.client.config.prefix || '!';

      // محاولة تغيير الكنية (حتى لو فشلت ما توقف الكود)
      api.changeNickname(botName, event.threadID, botID, err => {
        if (err) {
          console.log('[WARN] Bot is not admin, nickname not changed');
        }
      });

      const welcomeMsg = `
◈━━━━━━━★━━━━━━━◈
🌟 تم تفعيل البوت بنجاح
🤖 اسم البوت: ${botName}
🔰 البادئة: ${prefix}
🧭 اكتب ${prefix}help لعرض الأوامر
◈━━━━━━━★━━━━━━━◈

┏━⊱🔹 المطوّر 🔹⊰━┓
┃  سينكو
┃  17 سنة
┃ صلّوا على النبي ﷺ 🌹
┗━━━━━━━━━━━━━━━┛
`;

      setTimeout(() => {
        api.sendMessage(welcomeMsg, event.threadID);
      }, 1000);

    } catch (err) {
      console.error('[ERROR botJoinedGroup]:', err);
    }
  },
};
