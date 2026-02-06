const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'تحسين',
        version: '1.1',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: '🖼️ تحسين جودة الصورة إلى دقة 4K. قم بالرد على صورة لتحسينها.',
        category: 'image',
        guide: {
            en: '   {pn}تحسين [رد على صورة] أو {pn}تحسين [/@منشن | UID]'
        },
    },

    onStart: async ({ api, event }) => {
        const { senderID, mentions, messageReply } = event;
        let imageUrl;
        let targetIDForFilename = senderID;

        if (
            messageReply &&
            messageReply.attachments &&
            messageReply.attachments.length > 0 &&
            ['photo', 'sticker'].includes(messageReply.attachments[0].type)
        ) {
            imageUrl = messageReply.attachments[0].url;
            targetIDForFilename = messageReply.senderID;
        } else {
            let targetID = senderID;
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } else if (event.body.split(' ').length > 1) {
                const uid = event.body.split(' ')[1].replace(/[^0-9]/g, '');
                if (uid.length === 15 || uid.length === 16) targetID = uid;
            }
            targetIDForFilename = targetID;
            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        }

        if (!imageUrl) {
            return api.sendMessage(
                "❌ | من فضلك قم بالرد على صورة أو منشن شخص لتحسين صورته.",
                event.threadID
            );
        }

        const apiUrl = `https://hridoy-apis.vercel.app/tools/remini?url=${encodeURIComponent(imageUrl)}&apikey=hridoyXQC`;

        try {
            api.sendMessage(
                "✨ | جارٍ تحسين الصورة إلى جودة 4K… انتظر قليلاً",
                event.threadID
            );

            const response = await axios.get(apiUrl);

            if (response.data && response.data.status && response.data.result) {
                const enhancedImageResponse = await axios.get(
                    response.data.result,
                    { responseType: 'arraybuffer' }
                );

                const cacheDir = path.join(__dirname, 'cache');
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                const imagePath = path.join(
                    cacheDir,
                    `تحسين_${targetIDForFilename}_${Date.now()}.png`
                );

                fs.writeFileSync(
                    imagePath,
                    Buffer.from(enhancedImageResponse.data, 'binary')
                );

                api.sendMessage(
                    {
                        body: "✅ | تم تحسين الصورة بنجاح 🌟",
                        attachment: fs.createReadStream(imagePath),
                    },
                    event.threadID,
                    () => fs.unlinkSync(imagePath)
                );
            } else {
                api.sendMessage(
                    "⚠️ | فشل تحسين الصورة، قد يكون السيرفر متوقف أو نوع الصورة غير مدعوم.",
                    event.threadID
                );
            }
        } catch (error) {
            console.error("Error generating or sending 4K image:", error);
            api.sendMessage(
                "🚫 | حصل خطأ أثناء معالجة الصورة، حاول مرة أخرى لاحقاً.",
                event.threadID
            );
        }
    },
};
