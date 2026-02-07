const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('../../logger/logger');

module.exports = {
    config: {
        name: 'توأم2',
        version: '1.1',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يقوم بمطابقتك مع عضو عشوائي آخر من المجموعة باستخدام صورة حب مختلفة.',
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
                return api.sendMessage("❌ لا يوجد أعضاء كافيين لإيجاد توأم.", threadID);
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

            // اختيار الإيموجي حسب نسبة الحب
            let loveEmoji = '❤️';
            if (lovePercentage > 80) loveEmoji = '💖';
            else if (lovePercentage > 60) loveEmoji = '💕';

            const image1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const image2 = `https://graph.facebook.com/${partnerID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            const apiUrl = `https://sus-apis-2.onrender.com/api/love?image1=${encodeURIComponent(image1)}&image2=${encodeURIComponent(image2)}`;
            console.log(`[توأم2] طلب API: ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const cacheDir = path.join(__dirname, '..', 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `pair2_${senderID}_${partnerID}.png`);
            fs.writeFileSync(imagePath, Buffer.from(apiResponse.data, 'binary'));

            // رسالة أكثر تفاعلية
            const messageBody = 
                `💘 تم إيجاد التوأم! 💘\n\n` +
                `🥰 ${senderName} ${loveEmoji} ${partnerName}\n` +
                `💯 نسبة الحب: ${lovePercentage}%\n\n` +
                `✨ حظ سعيد لكما!`;

            api.sendMessage({
                body: messageBody,
                mentions: [
                    { tag: senderName, id: senderID },
                    { tag: partnerName, id: partnerID }
                ],
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => fs.unlinkSync(imagePath));

            log('info', `أمر توأم2 تم تنفيذه بواسطة ${senderID} → ${partnerID} في المحادثة ${threadID}`);
        } catch (error) {
            console.error("خطأ في أمر توأم2:", error);
            log('error', `خطأ أمر توأم2: ${error.message}`);
            api.sendMessage("❌ حدث خطأ أثناء إنشاء التوأم.", threadID);
        }
    },
};
