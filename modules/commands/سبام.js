const axios = require('axios');
const { log } = require('../../logger/logger');

module.exports = {
    config: {
        name: "سباب",
        version: "1.0",
        author: "Hridoy",
        countDown: 5,
        prefix: true,
        adminOnly: false,
        description: "يولّد سبّة عشوائية بطريقة مضحكة",
        category: "مرح",
        guide: {
            ar: "   {pn}: يولّد سبّة عشوائية."
        }
    },

    onStart: async ({ event, api }) => {
        try {
            const response = await axios.get('https://evilinsult.com/generate_insult.php?lang=en&type=json', { timeout: 15000 });
            const { insult } = response.data;

            // رسالة زخرفة بالعربي
            await api.sendMessage(`💥 سبّة عشوائية: ${insult}`, event.threadID);

            log('info', `أمر سَبّ تنفذ بواسطة ${event.senderID} في المحادثة ${event.threadID}`);
        } catch (error) {
            log('error', `خطأ في أمر سَبّ: ${error.message || 'خطأ غير معروف'}`);
            api.sendMessage('❌ حدث خطأ أثناء توليد السّبّة. حاول مرة أخرى.', event.threadID);
        }
    }
};
