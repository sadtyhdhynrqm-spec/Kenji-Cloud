module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '1.2',
    author: 'Hridoy',
    description: 'Sets bot nickname and initializes database when added to a new group with fancy welcome.',
    eventType: ['log:subscribe'], 
  },
  onStart: async ({ api, event }) => {
    try {
      const { Threads } = require('../../database/database');
      const botID = await api.getCurrentUserID();
      const addedParticipants = event.logMessageData.addedParticipants;

      console.log("Added Participants:", addedParticipants);
      console.log("Bot ID:", botID);

      // تحقق إذا تم إضافة البوت
      if (addedParticipants?.some(p => p.id === botID)) {
        await Threads.create(event.threadID, "New Group");
        
        const botName = global.client.config.botName || 'Kenji Cloud';
        api.changeNickname(botName, event.threadID, botID, (err) => {
          if (err) console.error("Failed to change bot nickname:", err);
        });

        // رسالة ترحيب فخمة وآمنة
        const welcomeMsg = `
◈━━━━━━━★━━━━━━━◈
🌟 ✅ تم الاتصال بنجاح!
💠 اسـم البوت: ${botName}
💠 استخدم ${global.client.config.prefix} للتحكم بالأوامر
✨ نتمنى لكم وقت ممتع مع البوت!
◈━━━━━━━★━━━━━━━◈
┏━⊱🔹الــــمـطــــــــــوࢪ🔹⊰━┓
┃  سـينكو ➤   الـمطوࢪ 
┃   17   ➤  الـعمࢪ
┃صلو على شفيع الامه🌹
┗━━━━━━━━━━━━━━━┛
`;

        // تأخير بسيط قبل إرسال الرسالة
        await new Promise(resolve => setTimeout(resolve, 1000));
        api.sendMessage(welcomeMsg, event.threadID);
      }
    } catch (error) {
      console.error("Error in botJoinedGroup event:", error);
    }
  },
};
