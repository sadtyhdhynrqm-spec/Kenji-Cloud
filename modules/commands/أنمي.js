const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "أنمي",
        version: "1.0",
        author: "Hridoy",
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: "يرسل صورة أنمي عشوائية.",
        category: "random",
        guide: {
            ar: "   {pn}أنمي : الحصول على صورة أنمي عشوائية"
        }
    },

    onStart: async ({ api, event }) => {
        try {
            const threadId = event.threadID;

            const apiUrl = `https://hridoy-apis.vercel.app/random/anime?apikey=hridoyXQC`;
            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            if (apiResponse.status !== 200) {
                throw new Error('فشل جلب الصورة');
            }

            const tempDir = path.join(__dirname, '../../temp');
            await fs.ensureDir(tempDir);
            const imagePath = path.join(tempDir, `anime_${Date.now()}.png`);
            await fs.writeFile(imagePath, Buffer.from(apiResponse.data));

            await api.sendMessage(
                {
                    body: '🎌 صورة أنمي عشوائية',
                    attachment: fs.createReadStream(imagePath),
                },
                threadId
            );

            await fs.unlink(imagePath);
        } catch (error) {
            api.sendMessage('❌ فشل تحميل صورة الأنمي.', event.threadID);
        }
    }
};
