const { inspect } = require('util');

const DEV_ID = '61586897962846'; // ضع هنا ID حساب المطور

module.exports = {
    config: {
        name: 'ايف',
        version: '2.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        adminOnly: false, // لن نستخدم admin، بل ID مطور فقط
        description: 'تنفيذ أي كود JavaScript داخل البوت.',
        category: 'owner',
        guide: {
            ar: '{pn}ايف <الكود> (أو الرد على رسالة تحتوي على كود)'
        },
    },

    onStart: async ({ api, event, args, isAdmin }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;
        const senderID = event.senderID;

        // تحقق من المطور فقط
        if (senderID !== DEV_ID) {
            return api.sendMessage('❌ أنت لا تملك صلاحية استخدام هذا الأمر.', threadID, messageID);
        }

        // الحصول على الكود من الرد أو الرسالة
        let code = '';
        if (event.messageReply && event.messageReply.body) {
            code = event.messageReply.body.trim();
        } else {
            code = args.join(' ').trim();
        }

        if (!code) {
            return api.sendMessage(
                '❌ يرجى كتابة كود JavaScript لتنفذه.\n\nمثال:\n!ايف 2+2',
                threadID,
                messageID
            );
        }

        try {
            // تنفيذ الكود
            let result = await eval(code);
            let output = inspect(result, { depth: 0 });

            // حماية التوكن
            output = output.replace(/process\.env\.TOKEN/g, '[محمي]');

            // صياغة الرسالة بالزخرفة
            const evalMessage =
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n` +
                `📌 نتيجة تنفيذ الكود\n\n` +
                `📝 الكود:\n${code}\n\n` +
                `📦 الناتج:\n${output}\n` +
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯`;

            api.sendMessage(evalMessage, threadID, messageID);
        } catch (err) {
            api.sendMessage(`❌ حدث خطأ أثناء تنفيذ الكود:\n${err.message}`, threadID, messageID);
        }
    },
};
