module.exports = {
  config: {
    name: 'غادر',
    version: '1.0',
    author: 'XaviaTeam',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true, // فقط أدمن البوت
    description: 'Makes the bot leave the current group or all groups.',
    category: 'group',
    guide: {
      en: '{pn} [groupID/all]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const botID = api.getCurrentUserID?.() || global.botID;
      const input = args[0]?.toLowerCase();
      const threadIDs = [];

      // إذا المستخدم كتب "all"، يغادر كل الجروبات ما عدا الجروب الحالي
      if (input === 'all') {
        const threadList = (await api.getThreadList(100, null, ['INBOX'])) || [];
        const groups = threadList.filter(
          (thread) =>
            thread.threadID !== event.threadID &&
            thread.isGroup &&
            thread.isSubscribed
        );
        threadIDs.push(...groups.map((t) => t.threadID));
      } else if (args.length > 0) {
        // تحويل المدخلات إلى threadIDs صحيحة
        const inputThreadIDs = args
          .map((id) => id.replace(/[^0-9]/g, ''))
          .filter((id) => id.length >= 16 && !isNaN(id));
        threadIDs.push(...inputThreadIDs);
      } else {
        threadIDs.push(event.threadID);
      }

      // الخروج من كل thread
      for (const threadID of threadIDs) {
        await new Promise((resolve) => {
          api.removeUserFromGroup(botID, threadID, () => resolve(true));
        });
        await new Promise((r) => setTimeout(r, 300)); // تأخير بسيط بين كل خروج
      }

      api.sendMessage('تم خروج البوت من الجروبات المحددة بنجاح.', event.threadID);

    } catch (error) {
      console.error('Error in غادر command:', error);
      api.sendMessage('حدث خطأ أثناء محاولة خروج البوت.', event.threadID);
    }
  },
};
