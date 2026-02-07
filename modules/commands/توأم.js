const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('../../logger/logger');

module.exports = {
    config: {
        name: 'توأم',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يقوم بمطابقتك مع شخص عشوائي من المجموعة باستخدام صورة حب.',
        category: 'fun',
        guide: {
            en: '   {pn}'
        },
    },

    onStart: async ({ api, event }) => {
        const { threadID, senderID } = event;

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const { participantIDs } = threadInfo;

            if (participantIDs.length < 2) {
                return api.sendMessage(
                    "❌ لا يوجد عدد كافي من الأشخاص في هذه المجموعة لإيجاد توأم.",
                    threadID
                );
            }

            let partnerID;
            do {
                partnerID = participantIDs[Math.floor(Math.random() * participantIDs.length)];
            } while (partnerID === senderID);

            const [senderInfo, partnerInfo] = await Promise.all([
                api.getUserInfo(senderID),
                api.getUserInfo(partnerID)
            ]);
            const senderName = senderInfo[senderID]?.name || 'غير معروف';
            const partnerName = partnerInfo[partnerID]?.name || 'غير معروف';

            const lovePercentage = Math.floor(Math.random() * 51) + 50;

            const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=400&height=400&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatarPartnerUrl = `https://graph.facebook.com/${partnerID}/picture?width=400&height=400&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            const apiUrl = `https://hridoy-apis.vercel.app/canvas/love?avatar1=${encodeURIComponent(avatarSenderUrl)}&avatar2=${encodeURIComponent(avatarPartnerUrl)}&apikey=hridoyXQC`;
            console.log(`[طلب API] ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[استجابة API] الحالة: ${apiResponse.status}, النص: ${apiResponse.statusText}`);

            const cacheDir = path.join(__dirname, '..', 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `pair_${senderID}_${partnerID}.png`);
            fs.writeFileSync(imagePath, Buffer.from(apiResponse.data, 'binary'));

            const messageBody = `💕 تم إيجاد التوأم بنجاح! 💕\n\n${senderName} & ${partnerName}\n\nنسبة الحب: ${lovePercentage}%`;

            api.sendMessage(
                {
                    body: messageBody,
                    mentions: [
                        { tag: senderName, id: senderID },
                        { tag: partnerName, id: partnerID }
                    ],
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                () => fs.unlinkSync(imagePath)
            );

            log('info', `أمر توأم تم تنفيذه بواسطة ${senderID} في المحادثة ${threadID} مع ${partnerID}`);
        } catch (error) {
            console.error("خطأ في أمر التوأم:", error);
            log('error', `خطأ أمر التوأم: ${error.message}`);
            api.sendMessage("❌ حدث خطأ أثناء إنشاء التوأم.", threadID);
        }
    },
};
