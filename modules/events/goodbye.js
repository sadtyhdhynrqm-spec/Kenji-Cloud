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
      const { logMessageData, threadID } = event;
      const ownUserID = api.getCurrentUserID();
      const leftUserID = logMessageData.leftParticipantFbId;
      const removedBy = logMessageData.removedByFbId;

      // إذا البوت هو اللي خرج
      if (leftUserID === ownUserID) return;

      // ❌ إذا تمت إزالة العضو (مش غادر بنفسه)
      if (removedBy) return;

      // ✅ العضو غادر بنفسه
      const goodbyeMessage = 'غادر عب اخر بكرامه 🌚🌼';

      await api.sendMessage(goodbyeMessage, threadID);

      log('info', `Goodbye (left voluntarily) sent in ${threadID} for user ${leftUserID}`);
    } catch (error) {
      console.log('[API Error]', error.message);
      log('error', `Goodbye event error: ${error.message}`);
    }
  },
};
