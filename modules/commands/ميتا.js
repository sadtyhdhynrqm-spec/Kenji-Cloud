const axios = require('axios');

module.exports = {
    config: {
        name: 'ميتا',
        version: '1.1',
        author: 'Hridoy | تعريب',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'الدردشة مع الذكاء الاصطناعي.',
        category: 'الذكاء_الاصطناعي',
        guide: {
            ar: '{pn}ذكاء <سؤالك>'
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

            // استدعاء API مع timeout
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/ai4chat?text=${encodeURIComponent(query)}`,
                { timeout: 15000 }
            );

            // التأكد من وجود البيانات قبل الإرسال
            const result = response.data?.result || response.data?.message || null;

            if (result) {
                api.sendMessage(
                    `| الذكاء الاصطناعي يقول:\n\n${result}`,
                    threadID,
                    messageID
                );
            } else {
                console.warn('الرد غير صالح أو فارغ من السيرفر:', response.data);
                api.sendMessage(
                    '⚠️ لم استطع الحصول على رد صالح من الذكاء الاصطناعي.\n🔁 حاول مرة أخرى لاحقًا.',
                    threadID,
                    messageID
                );
            }

        } catch (error) {
            console.error('خطأ أثناء الاتصال بالذكاء الاصطناعي:', error.message);

            // Retry صغير لو كان timeout
            if (error.code === 'ECONNABORTED') {
                try {
                    const retry = await axios.get(
                        `https://hridoy-apis.onrender.com/ai/ai4chat?text=${encodeURIComponent(query)}`,
                        { timeout: 15000 }
                    );
                    const retryResult = retry.data?.result || retry.data?.message || null;
                    if (retryResult) {
                        return api.sendMessage(
                            `| الذكاء الاصطناعي يقول:\n\n${retryResult}`,
                            threadID,
                            messageID
                        );
                    }
                } catch (retryError) {
                    console.error('Retry فشل:', retryError.message);
                }
            }

            api.sendMessage(
                '⚠️ حصل خطأ أثناء الاتصال بالذكاء الاصطناعي.\n🔁 حاول مرة أخرى لاحقًا.',
                threadID,
                messageID
            );
        }
    },
};
