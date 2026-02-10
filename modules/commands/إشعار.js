const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'إشعار',
        version: '1.2',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        adminOnly: true,
        description: 'إرسال إشعار إلى جميع المجموعات (للمشرف فقط).',
        category: 'admin',
        guide: {
            ar: '{pn}إشعار <النص> (أو الرد على وسائط مع <النص>)'
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const text = args.join(' ').trim();
        if (!text) {
            return api.sendMessage(
                '❌ يرجى كتابة نص الإشعار.\n\nمثال:\n!إشعار سيتم إيقاف البوت مؤقتًا',
                threadID,
                messageID
            );
        }

        try {
            const sendTime = new Date().toLocaleString('ar-EG');

            const allThreads = await api.getThreadList(100, null, ['INBOX']);
            const groupThreads = allThreads.filter(
                t => t.isGroup && t.participantIDs.includes(api.getCurrentUserID())
            );

            if (groupThreads.length === 0) {
                return api.sendMessage(
                    '⚠️ لا توجد مجموعات مفعّل فيها البوت.',
                    threadID,
                    messageID
                );
            }

            let attachments = [];
            if (event.messageReply && event.messageReply.attachments?.length > 0) {
                const cacheDir = path.resolve(__dirname, 'cache');
                await fs.ensureDir(cacheDir);

                for (const attachment of event.messageReply.attachments) {
                    const url =
                        attachment.url ||
                        (attachment.type === 'photo' ? attachment.largePreviewUrl : null);

                    if (!url) continue;

                    const filePath = path.resolve(
                        cacheDir,
                        `notify_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2)}`
                    );

                    const res = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    });

                    await fs.writeFile(filePath, res.data);
                    attachments.push(fs.createReadStream(filePath));
                }
            }

            // صياغة الرسالة بالزخرفة المطلوبة
            const notificationMessage =
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n` +
                `📢 إشـعـار إداري\n\n` +
                `📝 الرسالة:\n${text}\n\n` +
                `⏰ وقت الإرسال:\n${sendTime}\n` +
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯`;

            let successCount = 0;
            for (const thread of groupThreads) {
                await new Promise(resolve => {
                    api.sendMessage(
                        {
                            body: notificationMessage,
                            attachment: attachments.length ? attachments : undefined
                        },
                        thread.threadID,
                        err => {
                            if (!err) successCount++;
                            resolve();
                        }
                    );
                });
            }

            // تنظيف الملفات المؤقتة
            for (const stream of attachments) {
                fs.unlinkSync(stream.path);
            }

            api.sendMessage(
                `✅ تم إرسال الإشعار إلى ${successCount} مجموعة بنجاح.`,
                threadID,
                messageID
            );

        } catch (err) {
            api.sendMessage(
                '❌ حدث خطأ أثناء إرسال الإشعار.',
                threadID,
                messageID
            );
        }
    },
};
