const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "زوجين",
        version: "1.1",
        author: "Hridoy | بالعربي",
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: "يجلب ويرسل صور زوجين متطابقين عشوائياً.",
        category: "عشوائي",
        guide: {
            ar: "{pn}صور_زوجين: احصل على صور زوجين متطابقين عشوائياً."
        }
    },

    onStart: async ({ api, event }) => {
        try {
            const threadId = event.threadID;
            const apiUrl = `https://hridoy-apis.vercel.app/random/couple?apikey=hridoyXQC`;
            console.log(`[طلب API] جارٍ الإرسال إلى: ${apiUrl}`);

            const response = await axios.get(apiUrl, { responseType: 'json' });
            console.log(`[رد API] الحالة: ${response.status}, البيانات: ${JSON.stringify(response.data)}`);

            if (response.data.cowo && response.data.cewe) {
                const [cowoUrl, ceweUrl] = [response.data.cowo, response.data.cewe];
                const tempDir = path.join(__dirname, '../../temp');
                await fs.ensureDir(tempDir);

                const [cowoData, ceweData] = await Promise.all([
                    axios.get(cowoUrl, { responseType: 'arraybuffer' }),
                    axios.get(ceweUrl, { responseType: 'arraybuffer' })
                ]);

                const cowoPath = path.join(tempDir, `زوج_ذكر_${Date.now()}.jpg`);
                const cewePath = path.join(tempDir, `زوج_أنثى_${Date.now()}.jpg`);

                await Promise.all([
                    fs.writeFile(cowoPath, cowoData.data),
                    fs.writeFile(cewePath, ceweData.data)
                ]);

                await api.sendMessage(
                    {
                        body: '🖼️ هذه صور الزوجين المتطابقين:',
                        attachment: [
                            fs.createReadStream(cowoPath),
                            fs.createReadStream(cewePath)
                        ]
                    },
                    threadId
                );

                // حذف الملفات بعد الإرسال
                await Promise.all([
                    fs.unlink(cowoPath),
                    fs.unlink(cewePath)
                ]);

            } else {
                throw new Error('❌ لم يتم العثور على صور الزوجين في الرد.');
            }

        } catch (error) {
            console.error('خطأ في أمر صور_زوجين:', error);
            api.sendMessage('❌ فشل في جلب صور الزوجين.', event.threadID);
        }
    }
};
