const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: "كنيات",
    version: "1.0",
    author: "Gemini",
    countDown: 20,
    prefix: true,
    groupAdminOnly: false,
    description: "تعيين كنيات موحدة لـ 250 عضو مع استبدال كلمة اسم بالاسم الأول",
    category: "group",
    guide: {
      ar: "   {pn} <النمط> - استبدل كلمة 'اسم' بالاسم الأول لكل عضو"
    }
  },

  onStart: async ({ event, api, args }) => {
    try {
      const { threadID, senderID } = event;
      const OWNER_ID = "61586897962846";

      // التحقق من المجموعات
      if (!event.isGroup) {
        return api.sendMessage('❌ دايرك تكون داخل مجموعة يا زول.', threadID, event.messageID);
      }

      // التحقق من المالك
      if (senderID !== OWNER_ID) {
        return api.sendMessage('⚠️ دا الأمر مخصوص لمطور البوت بس.', threadID, event.messageID);
      }

      const template = args.slice(0).join(" ");
      if (!template || !template.includes("اسم")) {
        return api.sendMessage(
          '⚠️ لازم تكتب التنسيق المطلوب ويحتوي على كلمة (اسم)\nمثال:\nكنيات 『 「✽」 اسم ↩ نينجا ⁰ 』',
          threadID,
          event.messageID
        );
      }

      // جلب معلومات المجموعة
      const threadInfo = await api.getThreadInfo(threadID);
      if (!threadInfo?.participantIDs) {
        return api.sendMessage('❌ حصلت مشكلة في جلب معلومات المجموعة.', threadID, event.messageID);
      }

      const userIDs = threadInfo.participantIDs.slice(0, 250);
      api.sendMessage(`⏳ جاري تغيير كنيات ${userIDs.length} عضو...\n⚡ السرعة محسّنة`, threadID, event.messageID);

      let success = 0;
      const CONCURRENCY = 5;

      for (let i = 0; i < userIDs.length; i += CONCURRENCY) {
        const batch = userIDs.slice(i, i + CONCURRENCY);

        await Promise.all(
          batch.map(async (uid) => {
            try {
              const info = await api.getUserInfo(uid);
              const fullName = info[uid]?.name || "عضو";
              const firstName = fullName.split(" ")[0];

              const nickname = template.replace(
                /[\(\[\{\<\«『「]*اسم[\)\}\]\>\»』」]*/g,
                firstName
              );

              await api.changeNickname(nickname, threadID, uid);
              success++;
            } catch (_) {
              // تجاهل الأخطاء الفردية
            }
          })
        );
      }

      api.sendMessage(
        `✅ اكتملت العملية!\n✔️ تم تغيير: ${success}\n📝 النمط المستخدم:\n${template}`,
        threadID,
        event.messageID
      );

      log('info', `كنيات command executed by ${senderID} in thread ${threadID}`);
    } catch (error) {
      console.error("Nickname error:", error);
      api.sendMessage('❌ حصل خطأ أثناء تنفيذ الأمر.', event.threadID, event.messageID);
    }
  }
};
