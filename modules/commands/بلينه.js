const axios = require('axios');

module.exports = {
    config: {
        name: 'بلينه',
        version: '1.5',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'Chat with GPT-4 AI with real-time editing.',
        category: 'ai',
        guide: {
            en: '   {pn} <query>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const query = args.join(' ').trim();
        if (!query) {
            return api.sendMessage('❌ يرجى كتابة سؤالك. مثال: !gpt4 كيف حالك؟', threadID, messageID);
        }

        // إرسال رسالة انتظار
        const infoMsg = await api.sendMessage('🔍 جاري التفكير... يرجى الانتظار.', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/gpt4?ask=${encodeURIComponent(query)}`,
                { timeout: 30000 }
            );

            if (response.data.status && response.data.result) {
                const formattedResponse = `
╭─── 『 GPT-4 AI 』 ───╮
${response.data.result}
╰──────────────╯`.trim();
                
                // تعديل الرسالة السابقة بالإجابة النهائية
                return api.editMessage(formattedResponse, processingID);
            } else {
                throw new Error('فشل الحصول على إجابة صحيحة من المصدر.');
            }
        } catch (error) {
            console.error('GPT-4 error:', error.message);
            api.editMessage(`❌ حدث خطأ: ${error.message}`, processingID);
        }
    },
};
