const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'قبر', // اسم الأمر بالعربي
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ ميم قبر سكودوارد مع نصك',
        category: 'مرح',
        guide: {
            ar: '{pn}قبر <النص>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const userText = args.join(' ');

        if (!userText || userText.length < 1) {
            return api.sendMessage("❌ الرجاء كتابة نص. مثال: قبر راح الحماس 😅", event.threadID);
        }

        const apiUrl = `https://sus-apis-2.onrender.com/api/squidward-grave?text=${encodeURIComponent(userText)}`;

        try {
            api.sendMessage("🪦 جارٍ إنشاء صورة القبر، انتظر لحظة...", event.threadID);

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }
            const imagePath = path.join(cacheDir, `قبر_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                body: "🪦 تفضل صورة القبر!",
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (error) {
            console.error("خطأ أثناء إنشاء صورة القبر:", error);
            api.sendMessage("❌ تعذر إنشاء صورة القبر حالياً.", event.threadID);
        }
    }
};
