const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'طمس', // الاسم بالعربي
        version: '1.2',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'إنشاء صورة مطموسة لآفاتار المستخدم',
        category: 'مرح',
        guide: {
            ar: '   {pn}طمس [/@منشن|ايدي|رد] لإنشاء صورة مطموسة'
        },
    },

    onStart: async ({ api, event }) => {
        const { senderID, mentions, messageReply, body } = event;
        let targetID = senderID;

        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (messageReply && messageReply.senderID) {
            targetID = messageReply.senderID;
        } else if (body.split(' ').length > 1) {
            const uid = body.split(' ')[1].replace(/[^0-9]/g, '');
            if (uid.length === 15 || uid.length === 16) targetID = uid;
        }

        const imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        const apiUrl = `https://sus-apis-2.onrender.com/api/blur?image=${encodeURIComponent(imageUrl)}`;

        try {
            api.sendMessage('⏳ جاري إنشاء الصورة المطموسة... انتظر لحظة', event.threadID);

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imagePath = path.join(cacheDir, `blur_${targetID}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                body: '🖼️ تم إنشاء صورتك المطموسة!',
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));

        } catch (error) {
            console.error("❌ خطأ أثناء إنشاء أو إرسال الصورة المطموسة:", error);
            api.sendMessage("❌ عذرًا، لم أتمكن من إنشاء الصورة المطموسة الآن. حاول لاحقًا.", event.threadID);
        }
    },
};
