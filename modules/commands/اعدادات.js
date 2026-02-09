module.exports = {
  config: {
    name: 'اعدادات',
    version: '1.0',
    author: 'ᏕᎥᏁᎨᎧ',
    countDown: 3,
    groupAdminOnly: true,
    description: 'إعدادات حماية المجموعة',
    category: 'group',
    guide: {
      ar_SY: `{pn} استخدم هذا الأمر لإعدادات حماية المجموعة`
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      if (!event.isGroup) {
        return api.sendMessage('هذا الأمر يعمل داخل المجموعات فقط', event.threadID);
      }

      // جلب البيانات والتأكد منها
      const threadData = await global.controllers.Threads.get(event.threadID) || { data: {} };
      const current = threadData.data?.antiSettings || {};

      const keys = [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
        "notifyChange"
      ];

      // إنشاء القائمة الحالية
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
↫ أرسل الأرقام لتغيير الإعدادات`;

      // عرض القوائم أولاً
      await api.sendMessage(menu, event.threadID);

      // إذا لم يرسل المستخدم أي أرقام، نوقف هنا
      if (!args.length) return;

      const nums = args.map(Number).filter(n => n >= 1 && n <= 6);
      if (!nums.length) {
        return api.sendMessage('اختيار غير صالح', event.threadID);
      }

      const newSettings = {};
      for (const k of keys) newSettings[k] = !!current[k];

      for (const n of nums) {
        const key = keys[n - 1];
        newSettings[key] = !newSettings[key];
      }

      const isBotAdmin = Array.isArray(event.adminIDs) && event.adminIDs.includes(global.botID);
      if (!isBotAdmin) {
        newSettings.antiOut = false;
        newSettings.antiSpam = false;
        await api.sendMessage('البوت ليس مشرفاً، تم تعطيل بعض الحمايات', event.threadID);
      }

      await global.controllers.Threads.updateData(event.threadID, {
        antiSettings: newSettings,
      });

      // عرض التأكيد بعد التغيير
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
تم حفظ الإعدادات ✅`;

      await api.sendMessage(confirmMsg, event.threadID);

    } catch (error) {
      console.error("Error in settings command:", error);
      api.sendMessage('حدث خطأ أثناء محاولة تعديل الإعدادات.', event.threadID);
    }
  }
};
