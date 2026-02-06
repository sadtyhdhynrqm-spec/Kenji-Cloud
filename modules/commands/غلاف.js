const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createReadStream } = require('fs');
const { log } = require('../../logger/logger');

const createAxiosConfig = (timeout = 15000, isDownload = true) => ({
  timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': isDownload ? 'image/png, image/*' : 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': isDownload ? 'image' : 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site'
  },
  maxRedirects: 5,
  responseType: isDownload ? 'arraybuffer' : 'json'
});

module.exports = {
    config: {
        name: "غلاف",
        version: "1.0",
        author: "Hridoy",
        countDown: 3,
        prefix: true,
        groupAdminOnly: false,
        description: "إنشاء غلاف فيسبوك بالنمط 1 أو 2 مع نصوص مخصصة.",
        category: "media",
        guide: {
            en: "   {pn} 1 | الاسم | نص 1 | نص 2: إنشاء غلاف بالنمط 1 مع صورة المستخدم، الاسم، ونصين.\n   {pn} 2 | نص 1 | نص 2: إنشاء غلاف بالنمط 2 مع صورة المستخدم ونصين كاسم أول واسم آخر."
        }
    },
    onStart: async ({ event, api, args }) => {
        try {
            const threadId = event.threadID;
            const messageId = event.messageID;
            const senderId = event.senderID;

            if (!args[0] || !['1', '2'].includes(args[0])) {
                return api.sendMessage("❌ الرجاء استخدام: !غلاف 1 | الاسم | نص 1 | نص 2 أو !غلاف 2 | نص 1 | نص 2.", threadId, messageId);
            }

            const style = args[0];
            const userImageUrl = `https://graph.facebook.com/${senderId}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            let apiUrl;
            if (style === '1' && args.length >= 4) {
                const [_, name, text1, text2] = args.join(' ').split('|').map(item => item.trim());
                apiUrl = `https://hridoy-apis.vercel.app/canvas/facebook-cover-v1?imageUrl=${encodeURIComponent(userImageUrl)}&name=${encodeURIComponent(name || '')}&text1=${encodeURIComponent(text1 || '')}&text2=${encodeURIComponent(text2 || '')}&apikey=hridoyXQC`;
            } else if (style === '2' && args.length >= 3) {
                const [_, text1, text2] = args.join(' ').split('|').map(item => item.trim());
                apiUrl = `https://hridoy-apis.vercel.app/canvas/facebook-cover-v2?imageUrl=${encodeURIComponent(userImageUrl)}&firstName=${encodeURIComponent(text1 || '')}&lastName=${encodeURIComponent(text2 || '')}&apikey=hridoyXQC`;
            } else {
                return api.sendMessage(`❌ تنسيق خاطئ للنمط ${style}. استخدم: !غلاف 1 | الاسم | نص 1 | نص 2 أو !غلاف 2 | نص 1 | نص 2.`, threadId, messageId);
            }

            console.log(`[API Request] Sending to: ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, createAxiosConfig(45000, true));
            console.log(`[API Response] Status: ${apiResponse.status}, Status Text: ${apiResponse.statusText}`);

            if (apiResponse.status !== 200 || !apiResponse.data || apiResponse.data.byteLength < 1000) {
                throw new Error('استجابة غير صالحة من API إنشاء الغلاف');
            }

            const cacheDir = path.resolve(__dirname, '..', 'cache');
            await fs.ensureDir(cacheDir);
            const imagePath = path.resolve(cacheDir, `fbcover_${senderId}_${Date.now()}.png`);
            await fs.writeFile(imagePath, Buffer.from(apiResponse.data));

            const messageBody = `✅ تم إنشاء غلاف فيسبوك بالنمط ${style} الخاص بك!`;
            await new Promise((resolve, reject) => {
                api.sendMessage(
                    {
                        body: messageBody,
                        attachment: createReadStream(imagePath)
                    },
                    threadId,
                    (err) => {
                        fs.unlink(imagePath).catch(() => {});
                        if (err) reject(err);
                        else resolve();
                    },
                    messageId
                );
            });

            log('info', `أمر غلاف تم تنفيذه بواسطة ${senderId} في المحادثة ${threadId} للنمط ${style}`);
        } catch (error) {
            console.error("خطأ في أمر غلاف:", error);
            log('error', `خطأ أمر غلاف: ${error.message}`);
            api.sendMessage("❌ حدث خطأ أثناء إنشاء غلاف فيسبوك.", event.threadID, event.messageID);
        }
    }
};
