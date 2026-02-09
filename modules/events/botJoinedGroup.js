module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '1.0',
    author: 'Hridoy',
    description: 'Sets bot nickname and initializes database when added to a new group.',
    eventType: ['log:subscribe'], 
  },
  onStart: async ({ api, event }) => {
    try {
      const { Threads } = require('../../database/database');
      const botID = await api.getCurrentUserID();
      const addedParticipants = event.logMessageData.addedParticipants;

      if (addedParticipants && addedParticipants.some(p => p.userFbId === botID)) {
        // إنشاء بيانات المجموعة في قاعدة البيانات فور الدخول
        await Threads.create(event.threadID, "New Group");
        
        const botName = global.client.config.botName || 'Kenji Cloud';
        api.changeNickname(botName, event.threadID, botID, (err) => {
          if (err) console.error("Failed to change bot nickname:", err);
        });
        
        // إرسال رسالة ترحيبية لتأكيد العمل
        api.sendMessage(` ${global.client.config.prefix}help لرؤية الأوامر.`, event.threadID);
      }
    } catch (error) {
      console.error("Error in botJoinedGroup event:", error);
    }
  },
};
