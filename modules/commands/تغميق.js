const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'تغميق', // الاسم العربي للأمر
        aliases: ['غم'], // اختصار عربي
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'يحوّل وجه الشخص في الصورة إلى داكن باستخدام الذكاء الاصطناعي. يعمل مع صورتك الشخصية، مستخدم محدد بالرد أو بالذكر، UID، أو صورة مرسلة.',
        category: 'ai',
        guide: {
            ar: '   {pn}تغميق [رد على صورة، ذكر مستخدم، أو uid]\n   {pn}تغميق (لصورتك الشخصية)'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, messageReply } = event;
        let imageUrl;
        let targetIDForFilename = senderID;

        // إذا كان الرد على صورة أو ملصق
        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
            imageUrl = messageReply.attachments[0].url;
            targetIDForFilename = messageReply.senderID;
        } else {
            let targetID = senderID;
            // إذا تم ذكر مستخدم
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } 
            // إذا تم إدخال UID
            else if (args.length > 0) {
                const uid = args[0].replace(/[^0-9]/g, '');
                if (uid.length === 15 || uid.length === 16) targetID = uid;
            }
            targetIDForFilename = targetID;
            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        }

        if (!imageUrl) {
            return api.sendMessage("⚠️ يرجى الرد على صورة، ذكر مستخدم، أو إدخال UID صالح لجعل وجهه داكن.", event.threadID);
        }

        const apiUrl = `https://hridoy-apis.vercel.app/ai-image/dark-face?url=${encodeURIComponent(imageUrl)}&apikey=hridoyXQC`;

        try {
            api.sendMessage("🌑 | جارٍ جعل الوجه داكن باستخدام الذكاء الاصطناعي، يرجى الانتظار...", event.threadID);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }
            const imagePath = path.join(cacheDir, `تغميق_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (error) {
            console.error("خطأ في إنشاء صورة الوجه الداكن:", error);
            api.sendMessage("❌ حدث خطأ أثناء معالجة الصورة. يرجى المحاولة لاحقاً.", event.threadID);
        }
    }
};
