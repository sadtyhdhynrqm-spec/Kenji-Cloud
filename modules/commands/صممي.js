const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'صممي',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يولّد صورة باستخدام الذكاء الاصطناعي Imagen.',
        category: 'ai',
        guide: {
            ar: '   {pn}صورة <الوصف>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const prompt = args.join(' ').trim();
        if (!prompt) {
            return api.sendMessage(
                '❌ الرجاء كتابة وصف لتوليد الصورة.\nمثال: !صورة مدينة مستقبلية',
                threadID,
                messageID
            );
        }

        try {
            console.log(`طلب توليد صورة بالوصف: ${prompt}`);

            // رسالة انتظار مختصرة
            api.sendMessage('🎨 جاري توليد الصورة…', threadID, messageID);

            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/imagen?text=${encodeURIComponent(prompt)}`,
                { timeout: 15000, responseType: 'arraybuffer' }
            );

            console.log('تم استلام الصورة من Imagen');

            const cacheDir = path.resolve(__dirname, 'cache');
            await fs.ensureDir(cacheDir);
            const imagePath = path.resolve(cacheDir, `imagen_${threadID}_${Date.now()}.png`);

            await fs.writeFile(imagePath, Buffer.from(response.data));

            // إرسال الصورة مع رسالة نجاح
            api.sendMessage({
                body: `🖼️ تم توليد الصورة بنجاح! الوصف: "${prompt}"`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => fs.unlinkSync(imagePath), messageID);

        } catch (error) {
            console.error('حدث خطأ أثناء توليد الصورة:', error.message);
            api.sendMessage(`❌ حدث خطأ أثناء توليد الصورة: ${error.message}`, threadID, messageID);
        }
    },
};
