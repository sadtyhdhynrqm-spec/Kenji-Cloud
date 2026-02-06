const axios = require('axios');
const { log } = require('../../logger/logger');

module.exports = {
    config: {
        name: "قص",
        version: "1.1",
        author: "Hridoy | بالعربي",
        countDown: 5,
        prefix: true,
        adminOnly: false,
        description: "يقصر أي رابط باستخدام CleanURI API",
        category: "أدوات",
        guide: {
            ar: "{pn} <الرابط>: لقصر الرابط المرسل."
        }
    },

    onStart: async ({ event, api, args }) => {
        try {
            if (!args[0]) {
                return api.sendMessage('⚠️ الرجاء إرسال رابط ليتم قصه.', event.threadID);
            }

            const url = args.join(" ").trim();
            if (!/^https?:\/\/\S+\.\S+/.test(url)) {
                return api.sendMessage('❌ الرابط غير صالح. تأكد من كتابته بشكل صحيح وبدون مسافات.', event.threadID);
            }

            const response = await axios.post('https://cleanuri.com/api/v1/shorten', `url=${encodeURIComponent(url)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });

            const shortenedUrl = response.data.result_url;
            await api.sendMessage(`🔗 الرابط الأصلي: ${url}\n✂️ الرابط المختصر: ${shortenedUrl}`, event.threadID);

            log('info', `قص-الرابط تم تنفيذه بواسطة ${event.senderID} في المجموعة ${event.threadID}`);
        } catch (error) {
            log('error', `قص-الرابط خطأ: ${error.message || 'خطأ غير معروف'}`);
            api.sendMessage('❌ حدث خطأ أثناء قص الرابط. تحقق من الرابط وحاول مرة أخرى.', event.threadID);
        }
    }
};
