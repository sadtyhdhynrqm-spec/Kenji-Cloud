const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'عشوئي',
        version: '1.1',
        author: 'Hridoy',
        countDown: 10,
        prefix: false, 
        groupAdminOnly: false,
        description: 'فيديوهات عشوائية لموسيقى بنغالية',
        category: 'عشوائي',
        guide: {
            ar: 'اكتب bbm للحصول على فيديو BBM عشوائي 🎶'
        },
    },
    onStart: async ({ api, event }) => {
        const apiUrl = `https://hridoy-apis.vercel.app/random/bbm?apikey=hridoyXQC`;

        try {
            api.sendMessage('⏳ جاري تحميل فيديو BBM عشوائي...', event.threadID);

            // جلب رابط الفيديو
            const response = await axios.get(apiUrl);
            if (!response.data || !response.data.url) {
                return api.sendMessage("❌ فشل في جلب رابط الفيديو. حاول لاحقاً.", event.threadID);
            }
            const videoUrl = response.data.url;

            // تنزيل الفيديو
            const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });

            // حفظ الفيديو مؤقتاً
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const videoPath = path.join(cacheDir, `bbm_${Date.now()}.mp4`);
            fs.writeFileSync(videoPath, Buffer.from(videoResponse.data, 'binary'));

            // إرسال الفيديو وحذفه بعد الإرسال
            api.sendMessage({
                attachment: fs.createReadStream(videoPath)
            }, event.threadID, () => fs.unlinkSync(videoPath));

        } catch (error) {
            console.error("❌ خطأ أثناء جلب أو إرسال فيديو BBM:", error);
            api.sendMessage("❌ حدث خطأ أثناء تحميل أو إرسال الفيديو. حاول لاحقاً.", event.threadID);
        }
    }
};
