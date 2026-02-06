const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: 'بطاقة',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'توليد هوية وهمية عشوائية مع صورة ومعلومات شخصية.',
        category: 'fun',
        guide: {
            en: '{pn}بطاقة_وهمية'
        },
    },

    onStart: async ({ api, event }) => {
        const apiUrl = `https://sus-apis-2.onrender.com/api/fakeidentity`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.success || !data.identity) {
                return api.sendMessage("❌ فشل في توليد الهوية الوهمية.", event.threadID);
            }

            const id = data.identity;
            const info = 
`🆔 بطاقة وهمية
👤 الاسم: ${id.name}
👩‍🦰 الجنس: ${id.gender}
🎂 تاريخ الميلاد: ${id.dob}
📧 البريد الإلكتروني: ${id.email}
📞 الهاتف: ${id.phone}
💼 الوظيفة: ${id.job}
🏠 العنوان: ${id.address}
💻 اسم المستخدم: ${id.username}
🕓 تم الإنشاء: ${new Date(id.createdAt).toLocaleString()}`;

            const imageUrl = id.avatar;

            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imgPath = path.join(cacheDir, `fakeid_${Date.now()}.jpg`);
            fs.writeFileSync(imgPath, Buffer.from(imgRes.data, 'binary'));

            api.sendMessage({
                body: info,
                attachment: fs.createReadStream(imgPath)
            }, event.threadID, () => fs.unlinkSync(imgPath));

        } catch (err) {
            console.error("خطأ أثناء توليد الهوية الوهمية:", err);
            api.sendMessage("❌ حدث خطأ أثناء توليد الهوية الوهمية.", event.threadID);
        }
    }
};
