module.exports = {
  config: {
    name: 'اضافة',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: '➕ إضافة عضو إلى المجموعة.',
    category: 'group',
    guide: {
      en: '   {pn}اضافة [UID | @منشن]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let targetID;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args.length > 0) {
        targetID = args[0];
      } else {
        return api.sendMessage(
          '❌ | يرجى كتابة UID العضو أو منشنته لإضافته.',
          event.threadID
        );
      }

      if (!targetID) {
        return api.sendMessage(
          '⚠️ | العضو غير صالح.',
          event.threadID
        );
      }

      api.addUserToGroup(targetID, event.threadID, (err) => {
        if (err) {
          console.error("Failed to add user:", err);
          return api.sendMessage(
            '🚫 | فشل إضافة العضو، تأكد أن العضو صديق للبوت أو أن للبوت الصلاحيات الكافية.',
            event.threadID
          );
        }

        api.sendMessage(
          `✅ | تم إضافة العضو بنجاح إلى المجموعة.`,
          event.threadID
        );
      });

    } catch (error) {
      console.error("Error in add command:", error);
      api.sendMessage(
        '❌ | حدث خطأ أثناء محاولة إضافة العضو.',
        event.threadID
      );
    }
  },
};
