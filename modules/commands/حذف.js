const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'حذف',
    version: '1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: false, // ❌ لم يعد خاصًا بأدمن البوت
    description: 'حذف رسالة عن طريق الرد عليها (للمسؤولين فقط)',
    category: 'group',
    guide: {
      ar: '   {pn} ← رد على الرسالة الداير تحذفها'
    },
    languages: {
      ar: {
        noReply: 'كدي حرب احذفها انت  '-'',
        unsendFail: 'دي ما رسالتي .',
        notAdmin: '🚫 المعليش، الأمر دا للمشرفين بس.'
      }
    }
  },

  onStart: async ({ event, api }) => {
    const { threadID, senderID, messageReply } = event;

    try {
      // جلب معلومات المجموعة
      const threadInfo = await api.getThreadInfo(threadID);
      const isGroupAdmin = threadInfo.adminIDs.some(a => a.id === senderID);

      // تحقق من صلاحيات المسؤول
      if (!isGroupAdmin) {
        return api.sendMessage(
          global.client.commands.get('حذف').config.languages.ar.notAdmin,
          threadID,
          event.messageID
        );
      }

      // تحقق من الرد على رسالة
      if (!messageReply) {
        return api.sendMessage(
          global.client.commands.get('حذف').config.languages.ar.noReply,
          threadID,
          event.messageID
        );
      }

      // حذف الرسالة بدون إرسال رسالة نجاح
      await api.unsendMessage(messageReply.messageID);

      log('info', `Message unsent by group admin ${senderID}`);

    } catch (error) {
      log('error', `Unsend command error: ${error.message}`);
      api.sendMessage(
        global.client.commands.get('حذف').config.languages.ar.unsendFail,
        threadID
      );
    }
  }
};
