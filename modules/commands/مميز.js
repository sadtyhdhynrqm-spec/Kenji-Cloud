const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'ممز',
        version: '1.1',
        author: 'Hridoy | بالعربي',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ ميم للشخص الهادئ بالنص المقدم.',
        category: 'مرح',
        guide: {
            ar: '{pn}ممز-الشخص-الهادئ <النص>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const text = args.join(' ').trim();

        if (!text) {
            return api.sendMessage('⚠️ الرجاء إدخال نص لإنشاء ميم الشخص الهادئ.', event.threadID);
        }

        const apiUrl = `https://sus-apis-2.onrender.com/api/chill-guy?text=${encodeURIComponent(text)}`;

        try {
            console.log(`[طلب API] جاري الإرسال إلى: ${apiUrl}`);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[رد API] الحالة: ${response.status}, الرسالة: ${response.statusText}`);

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `ممز_هادئ_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            await api.sendMessage({
                body: '🖼️ هذا هو ميم الشخص الهادئ الخاص بك:',
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));

        } catch (error) {
            console.error("❌ خطأ في إنشاء أو إرسال صورة الشخص الهادئ:", error);
            api.sendMessage('❌ عذرًا، لم أتمكن من إنشاء ميم الشخص الهادئ الآن.', event.threadID);
        }
    },
};
