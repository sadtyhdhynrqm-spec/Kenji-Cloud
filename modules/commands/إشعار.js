const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config/config.json');

module.exports = {
    config: {
        name: 'إشعار',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        adminOnly: true,
        description: 'إرسال إشعار إلى جميع المجموعات (للمشرف فقط).',
        category: 'admin',
        guide: {
            en: '   {pn}إشعار <النص> (أو الرد على وسائط مع <النص>)'
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const text = args.join(' ').trim();
        if (!text) {
            return api.sendMessage(
                '❌ يرجى كتابة نص الإشعار.\n\nمثال:\n!إشعار مرحبًا بالجميع',
                threadID,
                messageID
            );
        }

        try {
            const adminName = config.ownerName || 'الإداري';

            const sendTime = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Dhaka' });

            const allThreads = await api.getThreadList(100, null, ['INBOX']);
            const groupThreads = allThreads.filter(
                t => t.isGroup && t.participantIDs.includes(api.getCurrentUserID())
            );

            if (groupThreads.length === 0) {
                return api.sendMessage(
                    '❌ لا توجد مجموعات مفعّل فيها البوت.',
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

                    if (url) {
                        const filePath = path.resolve(
                            cacheDir,
                            `noti_${threadID}_${Date.now()}_${Math.random()
                                .toString(36)
                                .substr(2, 5)}.${attachment.type}`
                        );

                        const response = await axios.get(url, {
                            responseType: 'arraybuffer',
                            timeout: 15000
                        });

                        await fs.writeFile(filePath, Buffer.from(response.data));
                        attachments.push(fs.createReadStream(filePath));
                    }
                }
            }

            const notificationMessage =
                `================================\n` +
                `📢 إشعار إداري\n` +
                `👤 المرسل: ${adminName}\n` +
                `--------------------------------\n` +
                `📝 الرسالة:\n${text}\n` +
                `--------------------------------\n` +
                `⏰ وقت الإرسال: ${sendTime}\n` +
                `================================`;

            let successCount = 0;
            for (const thread of groupThreads) {
                await new Promise(resolve => {
                    api.sendMessage(
                        {
                            body: notificationMessage,
                            attachment: attachments.length > 0 ? attachments : undefined
                        },
                        thread.threadID,
                        err => {
                            if (!err) successCount++;
                            if (attachments.length > 0) {
                                attachments.forEach(stream =>
                                    fs.unlinkSync(stream.path)
                                );
                            }
                            resolve();
                        }
                    );
                });
            }

            api.sendMessage(
                `✅ تم إرسال الإشعار بنجاح إلى ${successCount} مجموعة.`,
                threadID,
                messageID
            );

        } catch (error) {
            api.sendMessage(
                '❌ حدث خطأ أثناء إرسال الإشعار.',
                threadID,
                messageID
            );
        }
    },
};
