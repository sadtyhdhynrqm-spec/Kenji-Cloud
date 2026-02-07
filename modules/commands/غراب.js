const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'غراب', // تغيير اسم الأمر للعربي
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ صورة غراب يقدم شيئًا باستخدام صورة المستخدم والنص المرسل.',
        category: 'fun',
        guide: {
            en: '{pn}غراب <نص> [/@mention|uid|رد على رسالة]'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, messageReply } = event;
        let targetID = senderID;
        let text = args.join(' ').trim();

        if (!text) {
            return api.sendMessage('❌ من فضلك أرسل نصًا لإنشاء صورة الغراب.', event.threadID);
        }

        // تحديد المستخدم المستهدف
        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            const mentionText = mentions[targetID];
            text = text.replace(mentionText, '').trim();
        } else if (messageReply && messageReply.senderID) {
            targetID = messageReply.senderID;
        } else if (event.body.split(' ').length > 1) {
            const uid = event.body.split(' ').slice(1).join(' ').replace(/[^0-9]/g, '');
            if (uid.length === 15 || uid.length === 16) targetID = uid;
        }

        const userInfo = await api.getUserInfo(targetID);
        const imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

        const apiUrl = `https://sus-apis-2.onrender.com/api/raven-presenting?image=${encodeURIComponent(imageUrl)}&message=${encodeURIComponent(text)}`;

        try {
            console.log(`[API Request] إرسال إلى: ${apiUrl}`);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[API Response] الحالة: ${response.status}, Status Text: ${response.statusText}`);

            // إنشاء مجلد مؤقت إذا لم يكن موجود
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `raven_${targetID}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));

        } catch (error) {
            console.error("حدث خطأ أثناء إنشاء أو إرسال صورة الغراب:", error);
            api.sendMessage('❌ عذرًا، لم أتمكن من إنشاء صورة الغراب الآن.', event.threadID);
        }
    },
};
