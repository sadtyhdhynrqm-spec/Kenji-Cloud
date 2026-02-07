const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'كود',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true, // يمكن تغييره حسب رغبتك ليشتغل بدون بادئة
        groupAdminOnly: false,
        description: 'ينشئ رمز QR متدرج من النص المرسل.',
        category: 'utility',
        guide: {
            en: '{pn}qr-code <النص>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const text = args.join(' ').trim();

        if (!text) {
            return api.sendMessage('من فضلك أرسل نصًا لإنشاء رمز QR.', event.threadID);
        }

        const apiUrl = `https://sus-apis-2.onrender.com/api/gradient-qr?text=${encodeURIComponent(text)}`;

        try {
            console.log(`[API Request] إرسال إلى: ${apiUrl}`);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[API Response] الحالة: ${response.status} - ${response.statusText}`);

            // إنشاء مجلد مؤقت إذا لم يكن موجودًا
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            // حفظ الصورة مؤقتًا
            const imagePath = path.join(cacheDir, `qr_code_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            // إرسال الصورة وحذفها بعد الإرسال
            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error("حدث خطأ أثناء إنشاء أو إرسال صورة QR:", error);
            api.sendMessage('عذرًا، لم أتمكن من إنشاء رمز QR الآن.', event.threadID);
        }
    },
};
