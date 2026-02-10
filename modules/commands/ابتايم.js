const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'uptime',
    aliases: ['ابتايم'],
    version: '1.3',
    author: 'Hridoy',
    description: 'معلومات تشغيل النظام والبوت',
    countDown: 5,
    prefix: true,
    category: 'utility',
    adminOnly: true
  },

  onStart: async ({ api, event }) => {
    const threadID = event.threadID;
    const replyID = event.messageID;

    const waitingMsg = await api.sendMessage(
      '⏳ جاري فحص حالة النظام...',
      threadID,
      replyID
    );
    const processingID = waitingMsg.messageID;

    try {
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const systemInfo = {
        os: `${os.type()} ${os.arch()}`,
        node: process.version,
        cpu: os.cpus()[0].model,
        storage: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        cpuUsage: (process.cpuUsage().user / 1000000).toFixed(2) + ' %',
        ramUsage: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
      };

      const otherInfo = {
        date: moment().format('MMM D, YYYY'),
        time: moment().format('hh:mm:ss A'),
        users: global.users?.length || 0,
        threads: global.threads?.length || 0,
        ping: Math.floor(performance.now()) + 'ms',
        status: '⚠️ | ⊱𝑴𝗈𝖽𝖾𝗋𝖺𝗍𝖾 ⊱𝑳𝗈𝖺𝖽',
      };

      const message = `
⟡───── ⊱𝑼𝑷𝑻𝑰𝑴𝑬 ────⟡
⏰  ${uptime}

⟡─────── ⊱𝑺𝒀𝑺𝑻𝑬𝑴 ─────⟡
⊱𝑶𝑺        » ${systemInfo.os}
⊱𝑳𝑨𝑵𝑮     » ${systemInfo.node}
⊱𝑪𝑷𝑼       » ${systemInfo.cpu}
⊱𝑺𝑻𝑶𝑹𝑨𝑮𝑬 » ${systemInfo.storage}
⊱𝑪𝑷𝑼 𝑼𝑺𝑬  » ${systemInfo.cpuUsage}
⊱𝑹𝑨𝑴 𝑼𝑺𝑬  » ${systemInfo.ramUsage}

⟡────── ⊱𝑶𝑻𝑯𝑬𝑹 ──────⟡
⊱𝑫𝑨𝑻𝑬    » ${otherInfo.date}
⊱𝑻𝑰𝑴𝑬    » ${otherInfo.time}
⊱𝑼𝑺𝑬𝑹𝑺   » ${otherInfo.users}
⊱𝑻𝑯𝑹𝑬𝑨𝑫𝑺 » ${otherInfo.threads}
⊱𝑷𝑰𝑵𝑮    » ${otherInfo.ping}
⊱𝑺𝑻𝑨𝑻𝑼𝑺  » ${otherInfo.status}
⟡─────────────────────⟡
`;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('❌ حدث خطأ أثناء جلب المعلومات', processingID);
    }
  },
};
