const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '1.0',
        author: 'محمد',
        countDown: 3,
        prefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني',
        category: 'ai',
        guide: {
            en: '{pn} <سؤالك>'
        },
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;
        const userId = event.senderID;
        const query = args.join(' ').trim();

        if (!query) {
            return api.sendMessage('•-•وات ', threadID, messageID);
        }

        if (query.toLowerCase() === 'مسح' || query.toLowerCase() === 'reset') {
            module.exports.conversations.delete(userId);
            return api.sendMessage('•-•  تم مسح المحادثة', threadID, messageID);
        }

        const infoMsg = await api.sendMessage('•-• جاري المعالجة...', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }

            const history = module.exports.conversations.get(userId);
            history.push({ role: 'user', content: query });

            if (history.length > 20) history.splice(0, history.length - 20);

            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
            let formData = "";
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
            formData += `--${boundary}--\r\n`;

            const response = await axios({
                method: 'POST',
                url: 'https://api.deepai.org/hacking_is_a_serious_crime',
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                    'origin': 'https://deepai.org',
                    'user-agent': 'Mozilla/5.0'
                },
                data: formData
            });

            let reply = '';
            if (response.data) {
                if (typeof response.data === 'string') reply = response.data;
                else if (response.data.output) reply = response.data.output;
                else if (response.data.text) reply = response.data.text;
            }

            reply = reply
                .replace(/\\n/g, '\n')
                .replace(/\\u0021/g, '!')
                .replace(/\\"/g, '"')
                .trim();

            if (reply.length > 2000) reply = reply.substring(0, 1997) + '...';

            history.push({ role: 'assistant', content: reply });

            await api.editMessage(`•-• ${reply}`, processingID);

        } catch (error) {
            api.editMessage(`•-• ❌ حصل خطأ: ${error.message}`, processingID);
        }
    },
};
