const axios = require('axios');

module.exports = {
    config: {
        name: 'بلينه', // تم تغيير اسم الأمر
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'تحدث مع GPT-4 الذكي.',
        category: 'ذكاء اصطناعي',
        guide: {
            ar: '{pn}بلينه <سؤالك>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const query = args.join(' ').trim();
        if (!query) {
            return api.sendMessage('❌ الرجاء كتابة سؤالك. مثال: !بلينه اخبرني بمعلومة', threadID, messageID);
        }

        try {
            console.log(`إرسال طلب إلى GPT-4: ${query}`);
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/gpt4?ask=${encodeURIComponent(query)}`,
                { timeout: 15000 }
            );

            console.log('رد GPT-4:', response.data);

            if (response.data.status && response.data.result) {
                api.sendMessage(response.data.result, threadID, messageID);
            } else {
                throw new Error('رد غير صالح من GPT-4 API');
            }
        } catch (error) {
            console.error('خطأ GPT-4:', error.message);
            api.sendMessage(`❌ خطأ: ${error.message}`, threadID, messageID);
        }
    },
};
