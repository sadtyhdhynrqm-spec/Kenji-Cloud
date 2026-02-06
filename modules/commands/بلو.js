const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "بلو", // تم تعريب اسم الأمر
        version: "1.2",
        author: "Hridoy",
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: "إرسال صورة عشوائية من Blue Archive",
        category: "عشوائي",
        guide: {
            ar: "   {pn}بلو : للحصول على صورة عشوائية من Blue Archive 🖼️"
        }
    },

    onStart: async ({ api, event }) => {
        try {
            const threadId = event.threadID;

            // إعلام المستخدم بتحميل الصورة
            api.sendMessage('⏳ جاري تحميل صورة عشوائية من Blue Archive...', threadId);

            const apiUrl = `https://hridoy-apis.vercel.app/random/bluearchive?apikey=hridoyXQC`;
            console.log(`[API Request] Sending to: ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[API Response] Status: ${apiResponse.status}, Status Text: ${apiResponse.statusText}`);

            if (apiResponse.status !== 200 || !apiResponse.data || apiResponse.data.byteLength < 1000) {
                throw new Error('❌ استجابة الصورة من API غير صالحة');
            }

            // حفظ الصورة مؤقتًا
            const tempDir = path.join(__dirname, '../../temp');
            await fs.ensureDir(tempDir);
            const imagePath = path.join(tempDir, `blue_${Date.now()}.png`);
            await fs.writeFile(imagePath, Buffer.from(apiResponse.data));

            // إرسال الصورة
            await api.sendMessage(
                {
                    body: '🖼️ صورة عشوائية من Blue Archive',
                    attachment: fs.createReadStream(imagePath),
                },
                threadId
            );

            // حذف الصورة بعد الإرسال
            await fs.unlink(imagePath);

        } catch (error) {
            console.error('❌ خطأ في أمر بلو:', error);
            api.sendMessage('❌ فشل في جلب الصورة من Blue Archive. حاول لاحقاً.', event.threadID);
        }
    }
};
