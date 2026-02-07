const { log } = require('../../logger/logger');
const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'welcome',
    version: '1.2',
    author: 'Hridoy',
    eventType: ['log:subscribe']
  },

  onStart: async ({ event, api }) => {
    try {
      const { threadID, logMessageData } = event;
      const botID = api.getCurrentUserID();

      // الشخص/الكيان المضاف
      const added = logMessageData.addedParticipants[0];
      const addedID = added.userFbId;

      // ===============================
      // 1️⃣ إذا البوت نفسه اتضاف
      // ===============================
      if (addedID === botID) {
        const imageUrl = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const cacheDir = __dirname + '/cache';
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        const imagePath = `${cacheDir}/bot_join.png`;
        fs.writeFileSync(imagePath, Buffer.from(response.data));

        const botWelcome = `❖━┄⋄┄━╃⊱ ★ ⊰╄━┄⋄┄━❖
⌯︙  تـم الاتـصال بـنجاح ✅

اســـم البوت ⎆﹝ابلين ﹞⋄〚 ! 〛

⌯︙استخدم البادئة! للتحكم بالأوامر
❖━┄⋄┄━╃⊱ ★ ⊰╄━┄⋄┄━❖`;

        await api.sendMessage({
          body: botWelcome,
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => fs.unlinkSync(imagePath));

        return; // مهم جداً
      }

      // ===============================
      // 2️⃣ إذا عضو عادي اتضاف
      // ===============================
      const thread = await api.getThreadInfo(threadID);
      const userInfo = await api.getUserInfo(addedID);
      const userName = userInfo[addedID].name;
      const memberCount = thread.participantIDs.length;

      const welcomeText = `
❖━┄⋄┄━╃⊱ اهـــــلــيــن ⊰╄━┄⋄┄━❖

⌯︙🌸 نورت القروب يا 『 ${userName} 』
⌯︙👥 عدد الأعضاء الآن ↫ 『 ${memberCount} 』
⌯︙💬 نتمنى لك وقت جميل معنا

❖━┄⋄┄━╃⊱ نــورت مــكــانــك ⊰╄━┄⋄┄━❖
`;

      await api.sendMessage(welcomeText, threadID);

      log('info', `User ${userName} joined ${threadID}`);
    } catch (error) {
      console.log('[API Error]', error.message);
      log('error', `Welcome event error: ${error.message}`);
    }
  },
};
