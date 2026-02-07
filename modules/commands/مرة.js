const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "مرة",
    version: "1.0",
    author: "Hridoy",
    countDown: 10,
    role: 0,
    prefix: false,
    description: "يرسل فيديو محدد.",
    category: "media",
    guide: {
        ar: "اكتب فقط «مرة» لإرسال الفيديو."
    }
};

module.exports.onStart = async ({ api, event }) => {
    try {
        const threadId = event.threadID;

        const videoUrl = "https://drive.google.com/uc?export=download&id=1LDi1MfzVe3pyFNMVvTfcBe7jlxhwsUze";
        console.log(`[طلب فيديو] ${videoUrl}`);

        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        console.log(`[استجابة] الحالة: ${response.status}`);

        if (response.status !== 200 || !response.data || response.data.byteLength < 1000) {
            throw new Error('استجابة فيديو غير صالحة');
        }

        const tempDir = path.join(__dirname, '../../temp');
        await fs.ensureDir(tempDir);
        const videoPath = path.join(tempDir, `mara_${Date.now()}.mp4`);
        await fs.writeFile(videoPath, Buffer.from(response.data));

        await api.sendMessage(
            {
                body: '🎬 تفضل الفيديو',
                attachment: fs.createReadStream(videoPath),
            },
            threadId
        );

        await fs.unlink(videoPath);
    } catch (error) {
        console.error('خطأ أمر مرة:', error);
        api.sendMessage('❌ فشل تحميل أو إرسال الفيديو.', event.threadID);
    }
};
