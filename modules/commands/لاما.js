const axios = require('axios');

module.exports = {
    config: {
        name: 'لاما',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'الدردشة مع الذكاء الاصطناعي LLaMA 3.1 8B.',
        category: 'ai',
        guide: {
            ar: '   {pn}لاما <سؤالك>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const query = args.join(' ').trim();
        if (!query) {
            return api.sendMessage(
                '❌ اكتب سؤالك بعد الأمر.\nمثال:\n!لاما حدثني عن الفضاء',
                threadID,
                messageID
            );
        }

        try {
            console.log(`طلب LLaMA 3.1 8B بالسؤال: ${query}`);
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/llama-3.1-8b?text=${encodeURIComponent(query)}`,
                { timeout: 15000 }
            );

            console.log('رد LLaMA 3.1 8B:', response.data);

            if (response.data.status && response.data.result) {
                api.sendMessage(response.data.result, threadID, messageID);
            } else {
                throw new Error('استجابة غير صالحة من واجهة LLaMA');
            }
        } catch (error) {
            console.error('خطأ LLaMA 3.1 8B:', error.message);
            api.sendMessage(
                `❌ حصل خطأ:\n${error.message}`,
                threadID,
                messageID
            );
        }
    },
};
