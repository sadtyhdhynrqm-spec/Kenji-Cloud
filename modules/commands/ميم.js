const axios = require('axios');
const { log } = require('../../logger/logger');
const fs = require('fs-extra');

module.exports = {
    config: {
        name: "ميم",
        version: "1.0",
        author: "Hridoy",
        countDown: 5,
        prefix: true,
        adminOnly: false,
        description: "جلب ميمز عشوائية.",
        category: "fun",
        guide: {
            ar: 
`   {pn} : الحصول على ميم عشوائي
   {pn} 10 : الحصول على 10 ميمز عشوائية
   {pn} <كلمة> : البحث عن ميمات بكلمة (بحد أقصى 5)`
        }
    },

    onStart: async ({ event, api, args }) => {
        try {
            const baseUrl = "https://bangladeshi-meme-api.vercel.app/api";
            let endpoint, message;

            if (args[0] === "10") {
                endpoint = "/random10";
                message = "😂 تفضل 10 ميمات عشوائية:";
            } else if (args.length > 0) {
                endpoint = `/search?query=${encodeURIComponent(args.join(" "))}`;
                message = `🔎 نتائج البحث عن: "${args.join(" ")}"`;
            } else {
                endpoint = "/random1";
                message = "😂 ميم عشوائي:";
            }

            const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 15000 });
            const data = response.data;

            const cacheDir = './cache';
            await fs.ensureDir(cacheDir);
            const attachments = [];

            if (endpoint === "/random1") {
                const { id, title, image_url } = data;
                const imagePath = `${cacheDir}/meme_${id}_${Date.now()}.png`;
                const imageResponse = await axios.get(image_url, { responseType: 'arraybuffer', timeout: 15000 });
                await fs.writeFile(imagePath, Buffer.from(imageResponse.data));
                attachments.push(fs.createReadStream(imagePath));

                await api.sendMessage({
                    body: `${message}\n🆔 المعرف: ${id}\n📝 العنوان: ${title}`,
                    attachment: attachments
                }, event.threadID, () => fs.unlinkSync(imagePath));

            } else if (endpoint === "/random10") {
                for (const meme of data) {
                    const { id, image_url } = meme;
                    const imagePath = `${cacheDir}/meme_${id}_${Date.now()}.png`;
                    const imageResponse = await axios.get(image_url, { responseType: 'arraybuffer', timeout: 15000 });
                    await fs.writeFile(imagePath, Buffer.from(imageResponse.data));
                    attachments.push(fs.createReadStream(imagePath));
                }

                await api.sendMessage({
                    body: `${message}`,
                    attachment: attachments
                }, event.threadID, () =>
                    attachments.forEach(stream => fs.unlinkSync(stream.path))
                );

            } else {
                for (const meme of data.slice(0, 5)) {
                    const { id, image_url } = meme;
                    const imagePath = `${cacheDir}/meme_${id}_${Date.now()}.png`;
                    const imageResponse = await axios.get(image_url, { responseType: 'arraybuffer', timeout: 15000 });
                    await fs.writeFile(imagePath, Buffer.from(imageResponse.data));
                    attachments.push(fs.createReadStream(imagePath));
                }

                await api.sendMessage({
                    body: `${message}`,
                    attachment: attachments
                }, event.threadID, () =>
                    attachments.forEach(stream => fs.unlinkSync(stream.path))
                );
            }

            log('info', `أمر ميم تم تنفيذه بواسطة ${event.senderID} في ${event.threadID}`);
        } catch (error) {
            log('error', `خطأ أمر ميم: ${error.message || 'خطأ غير معروف'}`);
            api.sendMessage(
                '❌ حصل خطأ أثناء جلب الميمات، حاول لاحقاً.',
                event.threadID
            );
        }
    }
};
