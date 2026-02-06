const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "ممز-CJ",
        version: "1.1",
        author: "Hridoy | بالعربي",
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: "ينشئ ميم CJ 'Ohh Shit' بالنص المقدم.",
        category: "وسائط",
        guide: {
            ar: "{pn}ممز-CJ <النص>: لإنشاء ميم CJ بنصك."
        }
    },

    onStart: async ({ api, event, args }) => {
        const threadId = event.threadID;

        if (!args[0]) {
            return api.sendMessage("⚠️ الرجاء إدخال نص لإنشاء ميم CJ، مثال: !ممز-CJ Ohh Shit", threadId);
        }

        const text = encodeURIComponent(args.join(" "));
        const apiUrl = `https://sus-apis-2.onrender.com/api/cj-reaction?text=${text}`;
        console.log(`[طلب API] جاري الإرسال إلى: ${apiUrl}`);

        try {
            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[رد API] الحالة: ${apiResponse.status}, الرسالة: ${apiResponse.statusText}`);

            if (apiResponse.status !== 200 || !apiResponse.data || apiResponse.data.byteLength < 1000) {
                throw new Error("❌ الرد من API غير صالح أو الصورة صغيرة جدًا");
            }

            const tempDir = path.join(__dirname, 'temp');
            await fs.ensureDir(tempDir);

            const imagePath = path.join(tempDir, `ممز_CJ_${Date.now()}.png`);
            await fs.writeFile(imagePath, Buffer.from(apiResponse.data));

            await api.sendMessage(
                {
                    body: `🖼️ ميم CJ لنص: ${args.join(" ")}`,
                    attachment: fs.createReadStream(imagePath)
                },
                threadId,
                () => fs.unlink(imagePath)
            );

        } catch (error) {
            console.error("❌ خطأ في إنشاء أو إرسال ميم CJ:", error);
            api.sendMessage("❌ عذرًا، لم أتمكن من إنشاء ميم CJ الآن.", threadId);
        }
    }
};
