const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'افتار',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'إنشاء صورة أفاتار أنمي مع نص.',
        category: 'ترفيه',
        guide: {
            ar: '   {pn}افتار <النص> [/@منشن]'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions } = event;
        let targetID = senderID;
        let text = args.join(' ').trim();

        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            const mentionText = mentions[targetID];
            text = text.replace(mentionText, '').trim();
        }

        if (!text) {
            return api.sendMessage(
                '❌ من فضلك اكتب نصًا لإنشاء الأفاتار.',
                event.threadID
            );
        }

        const userInfo = await api.getUserInfo(targetID);
        const topText = encodeURIComponent(userInfo[targetID]?.name || 'غير معروف');

        const apiUrl = `https://sus-apis-2.onrender.com/api/anime-text?text=${encodeURIComponent(text)}&topText=${topText}`;

        try {
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }

            const imagePath = path.join(
                cacheDir,
                `avatar_${targetID}_${Date.now()}.png`
            );

            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage(
                {
                    attachment: fs.createReadStream(imagePath),
                },
                event.threadID,
                () => fs.unlinkSync(imagePath)
            );

        } catch (error) {
            console.error("خطأ أثناء إنشاء أو إرسال صورة الأفاتار:", error);
            api.sendMessage(
                '⚠️ حصل خطأ، ما قدرت أنشئ صورة الأفاتار حاليًا.',
                event.threadID
            );
        }
    },
};
