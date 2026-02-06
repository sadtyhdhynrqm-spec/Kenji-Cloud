const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'بلين',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'توليد صورة باستخدام Flux AI.',
        category: 'ai',
        guide: {
            en: '   {pn}بلين <النص المطلوب>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const prompt = args.join(' ').trim();
        if (!prompt) {
            return api.sendMessage('❌ الرجاء إدخال النص المطلوب لتوليد الصورة. مثال: !بلين منظر طبيعي جميل', threadID, messageID);
        }

        try {
            console.log(`طلب Flux بالنص: ${prompt}`);
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/flux?prompt=${encodeURIComponent(prompt)}`,
                { timeout: 15000, responseType: 'arraybuffer' }
            );

            console.log('تم استلام استجابة Flux');

            const cacheDir = path.resolve(__dirname, 'cache');
            await fs.ensureDir(cacheDir);
            const imagePath = path.resolve(cacheDir, `flux_${threadID}_${Date.now()}.png`);

            await fs.writeFile(imagePath, Buffer.from(response.data));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => fs.unlinkSync(imagePath), messageID);

        } catch (error) {
            console.error('خطأ في Flux:', error.message);
            api.sendMessage(`❌ حدث خطأ: ${error.message}`, threadID, messageID);
        }
    },
};
