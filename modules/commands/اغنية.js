const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createReadStream } = require('fs');
const { log } = require('../../logger/logger');

const createAxiosConfig = (timeout = 15000, isDownload = true) => ({
  timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': isDownload ? 'audio/mpeg, audio/*' : 'application/json, text/plain, */*'
  },
  maxRedirects: 5,
  responseType: isDownload ? 'arraybuffer' : 'json'
});

const retryRequest = async (requestFunc, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFunc();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

module.exports = {
  config: {
    name: "اغنية",
    version: "1.1",
    author: "Hridoy",
    countDown: 10,
    prefix: true,
    groupAdminOnly: false,
    description: "تحميل أغنية من Spotify وإرسالها كملف صوتي",
    category: "media",
    guide: {
      ar: "   {pn} اسم_الأغنية"
    }
  },

  onStart: async ({ event, api, args }) => {
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!args[0]) {
      return api.sendMessage('🎵 اكتب اسم الأغنية يا زول.', threadID, messageID);
    }

    const musicName = encodeURIComponent(args.join(" "));
    const apiUrl = `https://hridoy-apis.vercel.app/play/spotify-v2?q=${musicName}&apikey=hridoyXQC`;

    try {
      // تفاعل 🔂 مع رسالة المستخدم
      await api.sendMessage('🔂 جاري تحميل الأغنية...', threadID, messageID);

      const apiResponse = await retryRequest(() =>
        axios.get(apiUrl, createAxiosConfig(45000, true))
      );

      if (!apiResponse.data || apiResponse.data.byteLength < 1000) {
        throw new Error('ملف الصوت فاضي');
      }

      // حفظ الأغنية مؤقتاً
      const cacheDir = path.resolve(__dirname, '..', 'cache');
      await fs.ensureDir(cacheDir);
      const audioPath = path.resolve(cacheDir, `spotify_${Date.now()}.mp3`);
      await fs.writeFile(audioPath, Buffer.from(apiResponse.data));

      // إرسال الأغنية
      await api.sendMessage(
        {
          body: `🎧 تفضل أغنيتك: ${args.join(" ")} ✅`,
          attachment: createReadStream(audioPath)
        },
        threadID,
        () => fs.unlink(audioPath).catch(() => {}),
        messageID
      );

      log('info', `Spotify used by ${event.senderID}`);
    } catch (error) {
      log('error', `Spotify error: ${error.message}`);
      // تعديل التفاعل بدل رسالة الخطأ
      api.sendMessage(`❌ لم يتم تحميل الأغنية، حاول مرة تانية.`, threadID, messageID);
    }
  }
};
