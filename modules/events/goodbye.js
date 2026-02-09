const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'goodbye',
    version: '1.3',
    author: 'Hridoy',
    eventType: ['log:unsubscribe']
  },

  onStart: async ({ event, api }) => {
    try {
      const { logMessageData } = event;
      const ownUserID = api.getCurrentUserID();
      const leftUserID = logMessageData.leftParticipantFbId;
      const removedBy = logMessageData.removedByFbId;

      // إذا البوت خرج
      if (leftUserID === ownUserID) return;

      // إذا تمت إزالة العضو
      if (removedBy) return;

      // العضو غادر بنفسه → لا نفعل شيء
      log('info', `User ${leftUserID} left voluntarily (no goodbye message sent).`);
    } catch (error) {
      console.log('[API Error]', error.message);
      log('error', `Goodbye event error: ${error.message}`);
    }
  },
};
