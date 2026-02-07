const axios = require('axios');

module.exports = {
    config: {
        name: 'مسلم',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'الحصول على إجابات ومعلومات إسلامية.',
        category: 'utility',
        guide: {
            en: '   {pn}مسلم <نص السؤال>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const text = args.join(' ').trim();
        if (!text) {
            return api.sendMessage(
                '❌ من فضلك اكتب سؤالك.\n\nمثال:\n!مسلم حدثني عن الأنبياء',
                threadID,
                messageID
            );
        }

        try {
            console.log(`طلب MuslimAI بالنص: ${text}`);
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/muslimai?text=${encodeURIComponent(text)}`,
                { timeout: 15000 }
            );

            if (response.data.status && response.data.result) {
                const { answer, source } = response.data.result;

                let message = `📿 **الإجابة:**\n${answer}\n\n📖 **المصادر:**\n`;
                source.forEach((src, index) => {
                    message += `${index + 1}. ${src.surah_title}\n${src.surah_url}\n`;
                });

                api.sendMessage(message, threadID, messageID);
            } else {
                api.sendMessage(
                    '❌ حدث خطأ غير متوقع في جلب الإجابة.',
                    threadID,
                    messageID
                );
            }
        } catch (error) {
            console.error('خطأ MuslimAI:', error.message);
            api.sendMessage(
                '❌ حدث خطأ أثناء الاتصال بالخدمة، حاول لاحقًا.',
                threadID,
                messageID
            );
        }
    },
};
