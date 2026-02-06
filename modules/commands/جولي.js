const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "جولي",
    version: "1.0",
    author: "Hridoy",
    countDown: 10,
    role: 0,
    prefix: false,
    description: "يرسل فيديو محدد.",
    category: "وسائط",
    guide: {
        ar: "اكتب 'جولي' للحصول على الفيديو."
    }
};

module.exports.onStart = async ({ api, event }) => {
    try {
        const threadId = event.threadID;

        const videoUrl = "https://drive.google.com/uc?export=download&id=1eIgNABsGRChZaYaTC737_yr0GrJV5eEK";
        console.log(`[API Request] إرسال الفيديو من: ${videoUrl}`);

        // رسالة انتظار قصيرة
        api.sendMessage('🎬 جاري إرسال الفيديو…', threadId);

        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        console.log(`[API Response] Status: ${response.status}, Status Text: ${response.statusText}`);

        if (response.status !== 200 || !response.data || response.data.byteLength < 1000) {
            throw new Error('استجابة غير صالحة للفيديو من الرابط');
        }

        const tempDir = path.join(__dirname, '../../temp');
        await fs.ensureDir(tempDir);
        const videoPath = path.join(tempDir, `july_${Date.now()}.mp4`);
        await fs.writeFile(videoPath, Buffer.from(response.data));

        await api.sendMessage(
            {
                body: '✅ تم إرسال الفيديو!',
                attachment: fs.createReadStream(videoPath),
            },
            threadId
        );

        await fs.unlink(videoPath);
    } catch (error) {
        console.error('حدث خطأ في أمر جولي:', error);
        api.sendMessage('❌ فشل في جلب أو إرسال الفيديو.', event.threadID);
    }
};
