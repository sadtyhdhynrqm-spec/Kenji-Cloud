const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'goodbye',
    version: '1.2',
    author: 'Hridoy',
    eventType: ['log:unsubscribe'] // يلتقط خروج الأعضاء
  },

  onStart: async ({ event, api }) => {
    try {
      const { logMessageData, threadID } = event;
      const ownUserID = api.getCurrentUserID();
      const leftUserID = logMessageData.leftParticipantFbId;

      // إذا البوت هو اللي خرج
      if (leftUserID === ownUserID) return;

      // الرسالة المراد إرسالها عند مغادرة العضو
      const goodbyeMessage = 'غادر عب اخر بكرامه 🌚🌼';

      // إرسال الرسالة
      await api.sendMessage(goodbyeMessage, threadID);

      log('info', `Goodbye message sent to ${threadID} for user ${leftUserID}`);
    } catch (error) {
      console.log('[API Error]', error.message);
      log('error', `Goodbye event error: ${error.message}`);
    }
  },
};
