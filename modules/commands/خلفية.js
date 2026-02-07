const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'خلفية',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'إنشاء صورة بخلفية خضراء باستخدام صورة الحساب.',
        category: 'fun',
        guide: {
            en: '   {pn}خلفية [منشن | uid | رد]'
        },
    },

    onStart: async ({ api, event }) => {
        const { senderID, mentions } = event;
        let targetID = senderID;

        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (event.messageReply && event.messageReply.senderID) {
            targetID = event.messageReply.senderID;
        } else if (event.body.split(' ').length > 1) {
            const uid = event.body.split(' ')[1].replace(/[^0-9]/g, '');
            if (uid.length === 15 || uid.length === 16) targetID = uid;
        }

        const imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        const apiUrl = `https://sus-apis-2.onrender.com/api/green-screen?image=${encodeURIComponent(imageUrl)}`;

        try {
            console.log(`[طلب API] ${apiUrl}`);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }

            const imagePath = path.join(
                cacheDir,
                `greenscreen_${targetID}_${Date.now()}.png`
            );

            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage(
                {
                    body: '🟢 تم إنشاء الصورة بالخلفية الخضراء بنجاح!',
                    attachment: fs.createReadStream(imagePath)
                },
                event.threadID,
                () => fs.unlinkSync(imagePath)
            );

        } catch (error) {
            console.error('خطأ في إنشاء الصورة:', error);
            api.sendMessage(
                '❌ حدث خطأ أثناء إنشاء الصورة، حاول مرة أخرى لاحقًا.',
                event.threadID
            );
        }
    },

    handleReply: async () => {}
};
