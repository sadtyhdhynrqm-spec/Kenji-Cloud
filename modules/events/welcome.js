const { log } = require('../../logger/logger');

// نخزن القروبات اللي رحبنا فيها بالبوت
const greetedThreads = new Set();

// نخزن الأعضاء اللي رحبنا بيهم
const welcomedUsers = new Set();

module.exports = {
  config: {
    name: 'welcome',
    version: '2.2',
    author: 'Hridoy + Fixed',
    eventType: ['log:subscribe']
  },

  // ==================================
  // 1️⃣ حدث الانضمام (بوت + أعضاء)
  // ==================================
  onStart: async ({ event, api }) => {
    try {
      if (event.logMessageType !== 'log:subscribe') return;

      const { threadID, logMessageData } = event;
      const botID = api.getCurrentUserID();
      if (!logMessageData?.addedParticipants) return;

      for (const added of logMessageData.addedParticipants) {
        const addedID = added.userFbId;

        // ---------- لو البوت ----------
        if (addedID === botID) {
          if (!greetedThreads.has(threadID)) {
            await sendBotWelcome(api, threadID);
            greetedThreads.add(threadID);
          }
          continue;
        }

        // ---------- عضو عادي ----------
        await sendUserWelcome(api, threadID, addedID);
      }
    } catch (error) {
      log('error', `Welcome event error: ${error.message}`);
    }
  },

  // =================================================
  // 2️⃣ fallback لإضافة البوت (أول رسالة من البوت)
  // =================================================
  handleEvent: async ({ event, api }) => {
    try {
      const botID = api.getCurrentUserID();

      // fallback خاص بالبوت فقط
      if (event.senderID !== botID) return;
      if (greetedThreads.has(event.threadID)) return;

      await sendBotWelcome(api, event.threadID);
      greetedThreads.add(event.threadID);
    } catch (_) {}
  }
};

// ==================================
// رسالة ترحيب البوت (نص فقط)
// ==================================
async function sendBotWelcome(api, threadID) {
  const message = `❖━┄⋄┄━╃⊱ ★ ⊰╄━┄⋄┄━❖
⌯︙تـم الاتـصال بـنجاح ✅

⌯︙اســم البوت ⎆﹝ ابلين ﹞
⌯︙استخدم البادئة ! للتحكم بالأوامر

❖━┄⋄┄━╃⊱ ★ ⊰╄━┄⋄┄━❖`;

  await api.sendMessage(message, threadID);
  log('info', `Bot welcomed in ${threadID}`);
}

// ==================================
// رسالة ترحيب الأعضاء (نص فقط)
// ==================================
async function sendUserWelcome(api, threadID, userID) {
  if (welcomedUsers.has(userID + threadID)) return;

  const userInfo = await api.getUserInfo(userID);
  const thread = await api.getThreadInfo(threadID);

  const userName = userInfo[userID]?.name || 'عضو جديد';
  const memberCount = thread.participantIDs.length;

  const text = `
❖━┄⋄┄━╃⊱ اهـــــلــيــن ⊰╄━┄⋄┄━❖

⌯︙🌸 نورت القروب يا 『 ${userName} 』
⌯︙👥 عدد الأعضاء الآن ↫ 『 ${memberCount} 』
⌯︙💬 نتمنى لك وقت جميل معنا

❖━┄⋄┄━╃⊱ نــورت ⊰╄━┄⋄┄━❖
`;

  await api.sendMessage(text, threadID);
  welcomedUsers.add(userID + threadID);

  log('info', `User ${userName} welcomed in ${threadID}`);
  }
