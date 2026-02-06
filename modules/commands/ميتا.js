const axios = require('axios');

module.exports = {
    config: {
        name: 'ميتا',
        version: '1.0',
        author: 'Hridoy | تعريب',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'الدردشة مع الذكاء الاصطناعي.',
        category: 'الذكاء_الاصطناعي',
        guide: {
            ar: '   {pn}ذكاء <سؤالك>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const query = args.join(' ').trim();
        if (!query) {
            return api.sendMessage(
                '❌ اكتب سؤالك بعد الأمر.\n\n📌 مثال:\nذكاء احكي لي قصة قصيرة',
                threadID,
                messageID
            );
        }

        try {
            console.log(`طلب ذكاء اصطناعي: ${query}`);

            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/ai4chat?text=${encodeURIComponent(query)}`,
                { timeout: 15000 }
            );

            console.log('رد الذكاء الاصطناعي:', response.data);

            if (response.data.status && response.data.result) {
                api.sendMessage(
                    `🤖 | الذكاء الاصطناعي يقول:\n\n${response.data.result}`,
                    threadID,
                    messageID
                );
            } else {
                throw new Error('الرد غير صالح من السيرفر');
            }

        } catch (error) {
            console.error('خطأ الذكاء الاصطناعي:', error.message);
            api.sendMessage(
                '⚠️ حصل خطأ أثناء الاتصال بالذكاء الاصطناعي.\n🔁 حاول مرة أخرى لاحقًا.',
                threadID,
                messageID
            );
        }
    },
};
