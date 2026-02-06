const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'حجاب',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'يضيف حجاباً باستخدام الذكاء الاصطناعي على صورة الوجه. رَد على صورة أو ضع منشن لشخص.',
        category: 'ai',
        guide: {
            ar: '   {pn}حجاب [رد على صورة]\n   {pn}حجاب [/@اسم_المستخدم|uid]'
        },
    },
    onStart: async ({ api, event }) => {
        const { senderID, mentions, messageReply } = event;
        let imageUrl;
        let targetIDForFilename = senderID;

        // ===================================
        // التحقق من الصورة المردودة أو المنشن
        // ===================================
        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
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
            return api.sendMessage("❌ الرجاء الرد على صورة أو وضع منشن لتطبيق الحجاب على صورة الملف الشخصي.", event.threadID);
        }

        const apiUrl = `https://hridoy-apis.vercel.app/ai-image/custom?url=${encodeURIComponent(imageUrl)}&apikey=hridoyXQC`;

        try {
            // رسالة انتظار مزخرفة
            api.sendMessage("🧕✨ جاري تطبيق الحجاب باستخدام الذكاء الاصطناعي... يرجى الانتظار ✨🧕", event.threadID);

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `hijab_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            // إرسال الصورة مع زخرفة في الرسالة
            api.sendMessage({
                body: "🧕✨ تم تطبيق الحجاب بنجاح! ✨🧕",
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));

        } catch (error) {
            console.error("حدث خطأ أثناء إنشاء صورة الحجاب:", error);
            api.sendMessage("❌ حدث خطأ أثناء معالجة الصورة. حاول مرة أخرى لاحقاً.", event.threadID);
        }
    }
};
