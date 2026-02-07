const { log } = require('../../logger/logger');
const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'welcome',
    version: '1.0',
    author: 'Hridoy',
    eventType: ['log:subscribe']
  },
  onStart: async ({ event, api }) => {
    try {
      const { threadID, logMessageData } = event;
      const thread = await api.getThreadInfo(threadID);
      const newUser = logMessageData.addedParticipants[0];
      const uid = newUser.userFbId;
      const userInfo = await api.getUserInfo(uid);
      const userName = userInfo[uid].name;
      const memberCount = thread.participantIDs.length;

      // رابط الصورة الثابتة
      const imageUrl = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';

      // جلب الصورة كملف بايت
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const cacheDir = __dirname + '/cache';
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
      }
      const imagePath = `${cacheDir}/welcome_card.png`;
      fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

      // الرسالة الترحيبية
      const welcomeText = `╭═══════  ═══════╮

⌯︙⋄ 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 ↫    Ꮥ.ᎥᏁᎨᎧ ⋄

⌯︙⋄ 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄 ↫『 افلين 』⋄ 

⌯︙ ⋄🔑 𝐏𝐑𝐄𝐅𝐈𝐗 : 【 / 】⋄

╰═══════  ═══════╯`;

      // إرسال الرسالة مع الصورة
      await api.sendMessage({
        body: welcomeText,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => fs.unlinkSync(imagePath));

      log('info', `Welcome message sent to ${threadID} for ${userName}`);
    } catch (error) {
      console.log('[API Error]', error.message);
      log('error', `Welcome event error: ${error.message}`);
    }
  },
};
