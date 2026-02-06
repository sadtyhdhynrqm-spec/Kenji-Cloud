const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'مسدس', // اسم الامر بالعربي
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ صورة ميم بمسدس باستخدام صورة المستخدم والنص الخاص بك.',
        category: 'fun',
        guide: {
            ar: '{pn}مسدس <نص> (لنفسك)\n{pn}مسدس @شخص <نص>\n{pn}مسدس <رقم_المستخدم> <نص>\nرد على صورة مع {pn}مسدس <نص>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, messageReply } = event;

        let targetID = senderID;
        let imageUrl = null;
        let userText = "";
        let targetIDForFilename = senderID;

        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
            imageUrl = messageReply.attachments[0].url;
            userText = args.join(' ');
            targetIDForFilename = messageReply.senderID;
        } else {
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
                userText = args.slice(1).join(' ');
            } else if (args.length > 1 && args[0].match(/^\d+$/)) {
                targetID = args[0].replace(/[^0-9]/g, '');
                userText = args.slice(1).join(' ');
            } else {
                userText = args.join(' ');
            }
            targetIDForFilename = targetID;

            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        }

        if (!userText || userText.length < 1) {
            return api.sendMessage("❌ ادخل النص ليصنع الميم! مثال: مسدس بانغ!", event.threadID);
        }

        const apiUrl = `https://sus-apis-2.onrender.com/api/gun-meme?image=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(userText)}`;

        try {
            api.sendMessage("🔫 جاري إنشاء صورة الميم...", event.threadID);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `مسدس_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({ attachment: fs.createReadStream(imagePath) }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (error) {
            console.error("خطأ في إنشاء أو إرسال صورة الميم:", error);
            api.sendMessage("❌ عذراً، لم أتمكن من إنشاء صورة الميم الآن.", event.threadID);
        }
    }
};
