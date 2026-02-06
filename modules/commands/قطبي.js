const axios = require('axios');

module.exports = {
    config: {
        name: 'قطبي',  // الاسم أصبح عربي كما طلبت
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'الدردشة مع ذكاء الاصطناعي DeepSeek.',
        category: 'ai',
        guide: {
            en: '   {pn}قطبي <النص>' // دليل الاستخدام بالإنجليزية كما في البوت الأصلي
        },
    },
    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const prompt = args.join(' ').trim();
        if (!prompt) {
            return api.sendMessage('❌ يرجى إدخال نص للتفاعل مع الذكاء الاصطناعي. مثال: !قطبي احكي لي نكتة', threadID, messageID);
        }

        try {
            console.log(`طلب إلى DeepSeek مع النص: ${prompt}`);
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/deepseek?text=${encodeURIComponent(prompt)}`,
                { timeout: 15000 }
            );

            console.log('استجابة DeepSeek:', response.data);

            if (response.data.status && response.data.result) {
                api.sendMessage(response.data.result, threadID, messageID);
            } else {
                throw new Error('استجابة غير صالحة من API الخاص بـ DeepSeek');
            }
        } catch (error) {
            console.error('خطأ DeepSeek:', error.message);
            api.sendMessage(`❌ حدث خطأ: ${error.message}`, threadID, messageID);
        }
    },
};
