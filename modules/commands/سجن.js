const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'سجن',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'يضع فلتر السجن على صورة الملف الشخصي أو أي صورة.',
        category: 'مرح',
        guide: {
            ar: '{pn}سجن (صورتك)\n{pn}سجن @شخص\n{pn}سجن <uid>\nرد على صورة مع {pn}سجن'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, messageReply } = event;

        let targetID = senderID;
        let imageUrl = null;
        let targetIDForFilename = senderID;

        // التحقق من الصورة المردودة
        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
            imageUrl = messageReply.attachments[0].url;
            targetIDForFilename = messageReply.senderID;
        } else {
            // التحقق من المنشن أو uid
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } else if (args.length > 0 && args[0].match(/^\d+$/)) {
                targetID = args[0].replace(/[^0-9]/g, '');
            }
            targetIDForFilename = targetID;

            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        }

        const apiUrl = `https://sus-apis-2.onrender.com/api/jail?image=${encodeURIComponent(imageUrl)}`;

        try {
            // رسالة انتظار مختصرة
            api.sendMessage("🚔 جاري وضع صورة السجن…", event.threadID);

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `jail_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            // إرسال الصورة
            api.sendMessage({
                body: "🚔✨ تم تطبيق فلتر السجن!",
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (error) {
            console.error("حدث خطأ أثناء توليد أو إرسال صورة السجن:", error);
            api.sendMessage("❌ عذراً، لا يمكن توليد صورة السجن الآن.", event.threadID);
        }
    }
};
