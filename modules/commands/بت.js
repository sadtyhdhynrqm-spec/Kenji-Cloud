const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "تبكي_تمام", // الاسم العربي الرسمي
        aliases: ["بت"],   // الاختصار القصير العربي
        version: "1.0",
        author: "Hridoy",
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: "ينشئ ميم 'تبكي مقابل تمام' بنصين مختلفين.",
        category: "fun",
        guide: {
            ar: "   {pn}تبكي_تمام نص 1 | نص 2  أو  {pn}بـت نص 1 | نص 2: لإنشاء ميم بتأثير تبكي مقابل تمام."
        }
    },
    onStart: async ({ api, event, args }) => {
        try {
            const threadId = event.threadID;

            if (!args[0]) {
                return api.sendMessage("⚠️ يرجى إدخال نصين مفصولين بـ |، مثال: !تبكي_تمام حزين | سعيد", threadId);
            }

            const [text1, text2] = args.join(" ").split("|").map(item => item.trim());
            if (!text1 || !text2) {
                return api.sendMessage("⚠️ يرجى إدخال نصين مفصولين بـ |، مثال: !تبكي_تمام حزين | سعيد", threadId);
            }

            const apiUrl = `https://sus-apis-2.onrender.com/api/crying-vs-okay-emoji?text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`;
            console.log(`[طلب API] الإرسال إلى: ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[استجابة API] الحالة: ${apiResponse.status}, نص الحالة: ${apiResponse.statusText}`);

            if (apiResponse.status !== 200 || !apiResponse.data || apiResponse.data.byteLength < 1000) {
                throw new Error('استجابة الصورة من API غير صالحة');
            }

            const tempDir = path.join(__dirname, '../../temp');
            await fs.ensureDir(tempDir);
            const imagePath = path.join(tempDir, `تبكي_تمام_${Date.now()}.png`);
            await fs.writeFile(imagePath, Buffer.from(apiResponse.data));

            await api.sendMessage(
                {
                    body: `🖼️ ميم تبكي مقابل تمام: ${text1} | ${text2}`,
                    attachment: fs.createReadStream(imagePath),
                },
                threadId
            );

            await fs.unlink(imagePath);
        } catch (error) {
            console.error('خطأ في أمر تبكي_تمام:', error);
            api.sendMessage('❌ فشل إنشاء ميم تبكي مقابل تمام.', event.threadID);
        }
    }
};
