const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "لوفي",
        version: "1.0",
        author: "Hridoy",
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: "إرسال صورة عشوائية من ون بيس.",
        category: "random",
        guide: {
            en: "   {pn}لوفي: الحصول على صورة عشوائية من ون بيس."
        }
    },

    onStart: async ({ api, event }) => {
        try {
            const threadId = event.threadID;
            const apiUrl = `https://hridoy-apis.vercel.app/random/onepiece?apikey=hridoyXQC`;
            console.log(`[طلب API] ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, { responseType: 'json' });
            console.log(`[استجابة API] الحالة: ${apiResponse.status}, البيانات: ${JSON.stringify(apiResponse.data)}`);

            if (apiResponse.data.url) {
                const imageUrl = apiResponse.data.url;
                const tempPath = path.join(__dirname, `../../temp/onepeace_${Date.now()}.jpeg`);
                await fs.ensureDir(path.dirname(tempPath));

                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(tempPath, imageResponse.data);

                await api.sendMessage(
                    {
                        body: `🖼️ صورة عشوائية من ون بيس: ${apiResponse.data.name || 'غير معروف'}`,
                        attachment: fs.createReadStream(tempPath),
                    },
                    threadId
                );

                await fs.unlink(tempPath);
            } else {
                throw new Error('لم يتم العثور على رابط الصورة من API');
            }
        } catch (error) {
            console.error('خطأ في أمر لوفي:', error);
            api.sendMessage('❌ فشل في جلب صورة من ون بيس.', event.threadID);
        }
    }
};
