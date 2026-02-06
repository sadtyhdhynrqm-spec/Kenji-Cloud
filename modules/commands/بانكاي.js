module.exports = {
  config: {
    name: 'بانكاي',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true, 
    description: 'يقوم بطرد عضو من المجموعة.',
    category: 'group',
    guide: {
      ar: '   {pn} [UID|@mention]'
    },
  },
  onStart: async ({ api, event, args }) => {
    try {
      let targetID;

      // الحصول على الـ UID من المنشن أو من الوسيطات
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args.length > 0) {
        targetID = args[0];
      } else {
        return api.sendMessage('الرجاء تحديد UID أو منشن المستخدم لطرده.', event.threadID);
      }

      if (!targetID) {
        return api.sendMessage('المستخدم المحدد غير صالح للطرد.', event.threadID);
      }

      // رابط الصورة التي ستظهر قبل الطرد
      const imageUrl = 'https://i.imgur.com/yourImage.png'; // ضع رابط صورتك هنا

      // إرسال الصورة قبل الطرد
      api.sendMessage({ body: `تحذير! سيتم طرد هذا المستخدم.`, attachment: await require('axios')({ url: imageUrl, responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary')) }, event.threadID, async () => {
        // بعد إرسال الصورة مباشرة، طرد المستخدم
        api.removeUserFromGroup(targetID, event.threadID, (err) => {
          if (err) {
            console.error("فشل في طرد المستخدم:", err);
            return api.sendMessage('فشل في طرد المستخدم. تأكد من أن البوت مشرف في هذه المجموعة.', event.threadID);
          }
          api.sendMessage(`تم طرد المستخدم بنجاح: ${targetID}`, event.threadID);
        });
      });

    } catch (error) {
      console.error("حدث خطأ في أمر البانكاي:", error);
      api.sendMessage('حدث خطأ أثناء محاولة طرد المستخدم.', event.threadID);
    }
  },
};
