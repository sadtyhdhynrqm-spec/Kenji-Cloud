const { log } = require('../../logger/logger');

// نخزن الأعضاء اللي رحبنا بيهم (لكل قروب)
const welcomedUsers = new Set();

module.exports = {
  config: {
    name: 'welcome',
    version: '2.6',
    author: 'Hridoy + Premium Style',
    eventType: ['log:subscribe']
  },

  onStart: async ({ event, api }) => {
    try {
      if (event.logMessageType !== 'log:subscribe') return;

      const { threadID, logMessageData } = event;
      const botID = api.getCurrentUserID();

      if (!logMessageData?.addedParticipants) return;

      const newUsers = logMessageData.addedParticipants
        .map(p => p.userFbId)
        .filter(id => id !== botID);

      if (newUsers.length === 0) return;

      await sendGroupWelcome(api, threadID, newUsers);

    } catch (error) {
      log('error', `Welcome event error: ${error.message}`);
    }
  }
};

// ==================================
// رسالة ترحيب جماعية فخمة جدًا
// ==================================
async function sendGroupWelcome(api, threadID, userIDs) {
  const threadInfo = await api.getThreadInfo(threadID);
  const membersInfo = await api.getUserInfo(userIDs);

  const namesList = userIDs
    .map(id => {
      const key = `${id}_${threadID}`;
      if (welcomedUsers.has(key)) return null;
      welcomedUsers.add(key);
      return membersInfo[id]?.name || 'عضو جديد';
    })
    .filter(Boolean);

  if (namesList.length === 0) return;

  const memberCount = threadInfo.participantIDs.length;

  const message = `
╔═══════════❀═══════════╗
   نـورتـم مـــــجـمـوعـتـنه الــــــسقيرة 


${namesList.map((name, i) => `🌟 ${i + 1}. ${name}`).join('\n')}

👥 عدد الأعضاء الحالي: ${memberCount}
💬 نتمنى لكم أوقات ممتعة وذكريات رائعة معنا!
        ✨ 𝓝𝓲𝓬𝓮 𝓽𝓸 𝓢𝓮𝓮 𝓨𝓸𝓾 ✨
╚══════════❀══════════╝
`;

  await api.sendMessage(message, threadID);
  log('info', `Users ${namesList.join(', ')} welcomed in ${threadID}`);
}
