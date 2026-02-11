const { log } = require('../../logger/logger');

// نخزن الأعضاء اللي رحبنا بيهم (لكل قروب)
const welcomedUsers = new Set();

module.exports = {
  config: {
    name: 'welcome',
    version: '2.7',
    author: 'Hridoy + Premium Mention Edit',
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
// رسالة ترحيب مع منشن رسمي للأعضاء
// ==================================
async function sendGroupWelcome(api, threadID, userIDs) {
  const threadInfo = await api.getThreadInfo(threadID);
  const membersInfo = await api.getUserInfo(userIDs);

  const mentions = [];
  let bodyText = `
╔═════════❀═════════╗
   نـورتـم مـــــجـمـوعـتـنـا الــــــسـقـيـرة 💛

`;

  userIDs.forEach((id, index) => {
    const key = `${id}_${threadID}`;
    if (welcomedUsers.has(key)) return;

    welcomedUsers.add(key);

    const name = membersInfo[id]?.name || 'عضو جديد';
    const tag = `@${name}`;

    bodyText += ` ${index + 1}. ${tag}\n`;

    mentions.push({
      tag,
      id
    });
  });

  if (mentions.length === 0) return;

  const memberCount = threadInfo.participantIDs.length;

  bodyText += `

👥 عدد الأعضاء الحالي: ${memberCount}
💬 نتمنى لكم أوقات ممتعة وذكريات رائعة معنا!
        ✨ 𝓝𝓲𝓬𝓮 𝓽𝓸 𝓢𝓮𝓮 𝓨𝓸𝓾 ✨
╚════════❀════════╝
`;

  await api.sendMessage(
    {
      body: bodyText,
      mentions
    },
    threadID
  );

  log('info', `Users welcomed with mention in ${threadID}`);
  }
