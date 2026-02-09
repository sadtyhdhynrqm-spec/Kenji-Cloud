const { log } = require('../../logger/logger');

// نخزن الأعضاء اللي رحبنا بيهم (لكل قروب)
const welcomedUsers = new Set();

module.exports = {
  config: {
    name: 'welcome',
    version: '2.3',
    author: 'Hridoy + Fixed',
    eventType: ['log:subscribe']
  },

  // ==================================
  // حدث انضمام الأعضاء فقط
  // ==================================
  onStart: async ({ event, api }) => {
    try {
      if (event.logMessageType !== 'log:subscribe') return;

      const { threadID, logMessageData } = event;
      const botID = api.getCurrentUserID();

      if (!logMessageData?.addedParticipants) return;

      for (const added of logMessageData.addedParticipants) {
        const userID = added.userFbId;

        // ❌ نتجاهل البوت تماماً
        if (userID === botID) continue;

        // ✅ نرحب بالعضو فقط
        await sendUserWelcome(api, threadID, userID);
      }
    } catch (error) {
      log('error', `Welcome event error: ${error.message}`);
    }
  }
};

// ==================================
// رسالة ترحيب الأعضاء
// ==================================
async function sendUserWelcome(api, threadID, userID) {
  const key = `${userID}_${threadID}`;
  if (welcomedUsers.has(key)) return;

  const userInfo = await api.getUserInfo(userID);
  const threadInfo = await api.getThreadInfo(threadID);

  const userName = userInfo[userID]?.name || 'عضو جديد';
  const memberCount = threadInfo.participantIDs.length;

  const message = `
❖━┄⋄┄━╃⊱ اهـــــلــيــن ⊰╄━┄⋄┄━❖

⌯︙🌸 نورت القروب يا 『 ${userName} 』
⌯︙👥 عدد الأعضاء الآن ↫ 『 ${memberCount} 』
⌯︙💬 نتمنى لك وقت جميل معنا

❖━┄⋄┄━╃⊱ نــورت ⊰╄━┄⋄┄━❖
`;

  await api.sendMessage(message, threadID);
  welcomedUsers.add(key);

  log('info', `User ${userName} welcomed in ${threadID}`);
  }
