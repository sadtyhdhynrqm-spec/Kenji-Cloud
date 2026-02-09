module.exports = {
  config: {
    name: 'اعدادات',
    version: '1.0',
    author: 'ᏕᎥᏁᎨᎧ',
    countDown: 3,
    groupAdminOnly: true, // حسب صلاحيات 1 في الكود الأصلي
    description: 'إعدادات حماية المجموعة',
    category: 'group',
    guide: {
      ar_SY: `   {pn} استخدم هذا الأمر لإعدادات حماية المجموعة`
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      // تحقق من أن الأمر داخل مجموعة
      if (!event.isGroup) {
        return api.sendMessage('هذا الأمر يعمل داخل المجموعات فقط', event.threadID);
      }

      const threadData = await global.controllers.Threads.get(event.threadID);
      const current = threadData.data?.antiSettings || {};

      const keys = [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
        "notifyChange"
      ];

      // إذا لم يرسل المستخدم أرقام لتغيير الإعدادات
      if (!args.length) {
        const show = {};
        for (const k of keys) show[k] = current[k] ? "✅" : "❌";

        const menu = 
`╭━〔 🛡 إعدادات المجموعة 🛡 〕━╮
① [${show.antiSpam}] مكافحة السبام
② [${show.antiOut}] منع الخروج
③ [${show.antiChangeGroupName}] حماية اسم المجموعة
④ [${show.antiChangeGroupImage}] حماية صورة المجموعة
⑤ [${show.antiChangeNickname}] حماية الكنيات
⑥ [${show.notifyChange}] إشعارات الأحداث
╰━━━━━━━━━━━━━━━━━╯
↫ رد بالأرقام لتغيير الإعدادات`;

        return api.sendMessage(menu, event.threadID);
      }

      // تحويل args إلى أرقام صحيحة بين 1 و 6
      const nums = args.map(Number).filter(n => n >= 1 && n <= 6);
      if (!nums.length) {
        return api.sendMessage('اختيار غير صالح', event.threadID);
      }

      // إنشاء نسخة من الإعدادات الحالية
      const newSettings = {};
      for (const k of keys) newSettings[k] = !!current[k];

      // تبديل الإعدادات حسب الأرقام المرسلة
      for (const n of nums) {
        const key = keys[n - 1];
        newSettings[key] = !newSettings[key];
      }

      // تحقق من أن البوت مشرف
      const isBotAdmin = event.adminIDs?.includes(global.botID);
      if (!isBotAdmin) {
        newSettings.antiOut = false;
        newSettings.antiSpam = false;
        await api.sendMessage('البوت ليس مشرفاً، تم تعطيل بعض الحمايات', event.threadID);
      }

      // عرض التأكيد
      const view = {};
      for (const k of keys) view[k] = newSettings[k] ? "✅" : "❌";

      const confirmMsg = 
`╭━〔 ⚙️ تأكيد الإعدادات 〕━╮
① [${view.antiSpam}] مكافحة السبام
② [${view.antiOut}] منع الخروج
③ [${view.antiChangeGroupName}] حماية الاسم
④ [${view.antiChangeGroupImage}] حماية الصورة
⑤ [${view.antiChangeNickname}] حماية الكنيات
⑥ [${view.notifyChange}] إشعارات
╰━━━━━━━━━━━━━━━━╯
  تفاعل بـ 👍 للحفظ`;

      const sentMsg = await api.sendMessage(confirmMsg, event.threadID);

      // إضافة رد فعل 👍 لتأكيد
      sentMsg.addReactEvent({
        callback: async ({ reaction }) => {
          if (reaction !== "👍") return;

          await global.controllers.Threads.updateData(event.threadID, {
            antiSettings: newSettings,
          });

          api.sendMessage('تم حفظ الإعدادات', event.threadID);
        }
      });

    } catch (error) {
      console.error("Error in settings command:", error);
      api.sendMessage('حدث خطأ أثناء محاولة تعديل الإعدادات.', event.threadID);
    }
  }
};
