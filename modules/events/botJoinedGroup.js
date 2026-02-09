module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '1.3',
    author: 'Hridoy',
    description: 'Sends welcome message when bot is added to a new group, works without Admin.',
    eventType: ['log:subscribe'],
  },
  onStart: async ({ api, event }) => {
    try {
      const { Threads } = require('../../database/database');
      const botID = await api.getCurrentUserID();
      const addedParticipants = event.logMessageData?.addedParticipants;

      if (!addedParticipants) return;

      // تحقق إذا البوت هو الذي تمت إضافته
      if (addedParticipants.some(p => String(p.userFbId) === String(botID))) {
        console.log("🤖 تم إضافة البوت إلى مجموعة:", event.threadID);

        // إنشاء بيانات المجموعة في قاعدة البيانات
        try {
          await Threads.create(event.threadID, "New Group");
          console.log("🗄 تم إنشاء سجل في قاعدة البيانات للمجموعة:", event.threadID);
        } catch (dbErr) {
          console.error("❌ خطأ في إنشاء قاعدة البيانات:", dbErr);
        }

        // إرسال رسالة ترحيبية للجميع
        try {
          const memberNames = addedParticipants
            .filter(p => String(p.userFbId) !== String(botID))
            .map(p => p.fullName)
            .join(', ');

          const welcomeMessage = memberNames
            ? `✅ مرحباً ${memberNames}! البوت جاهز للعمل. اكتب ${global.client.config.prefix}help لرؤية الأوامر.`
            : `✅ مرحباً! البوت جاهز للعمل. اكتب ${global.client.config.prefix}help لرؤية الأوامر.`;

          await api.sendMessage({ body: welcomeMessage }, event.threadID);
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
