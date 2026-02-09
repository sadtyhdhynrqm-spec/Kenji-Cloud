module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '1.1',
    author: 'Hridoy',
    description: 'Sets bot nickname and sends welcome message when added to a new group.',
    eventType: ['log:subscribe'], 
  },
  onStart: async ({ api, event }) => {
    try {
      const { Threads } = require('../../database/database');
      const botID = await api.getCurrentUserID();
      const addedParticipants = event.logMessageData.addedParticipants;

      // التحقق إذا البوت هو الذي تم إضافته
      if (addedParticipants && addedParticipants.some(p => p.userFbId === botID)) {
        console.log("🤖 تم إضافة البوت إلى مجموعة:", event.threadID);

        // إنشاء بيانات المجموعة في قاعدة البيانات
        try {
          await Threads.create(event.threadID, "New Group");
          console.log("🗄 تم إنشاء سجل في قاعدة البيانات للمجموعة:", event.threadID);
        } catch (dbErr) {
          console.error("❌ خطأ في إنشاء قاعدة البيانات:", dbErr);
        }

        // تغيير اسم البوت إذا كان ممكن
        const botName = global.client.config.botName || 'Kenji Cloud';
        try {
          await api.changeNickname(botName, event.threadID, botID);
          console.log("✏️ تم تغيير اسم البوت إلى:", botName);
        } catch (err) {
          console.warn("⚠️ لا يمكن تغيير اسم البوت (ربما ليس Admin):", err.message);
        }

        // إرسال رسالة ترحيبية
        try {
          await api.sendMessage(
            `✅ مرحباً! البوت جاهز للعمل. اكتب ${global.client.config.prefix}help لرؤية الأوامر.`,
            event.threadID
          );
          console.log("💌 تم إرسال رسالة الترحيب.");
        } catch (msgErr) {
          console.error("❌ خطأ في إرسال رسالة الترحيب:", msgErr);
        }
      }
    } catch (error) {
      console.error("❌ خطأ في حدث botJoinedGroup:", error);
    }
  },
};
