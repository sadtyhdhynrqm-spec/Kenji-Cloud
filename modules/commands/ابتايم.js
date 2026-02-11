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
      const uptime = `${days}ي ${hours}س ${minutes}د ${seconds}ث`;

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
        ping: Math.floor(performance.now()) + 'ملليثانية',
        status: '⚠️ | تحميل متوسط',
      };

      const message = `
⟡───── ⊱𝑼𝑷𝑻𝑰𝑴𝑬 ────⟡
⏰  مدة التشغيل: ${uptime}

⟡─────── ⊱𝑺𝒀𝑺𝑻𝑬𝑴 ─────⟡
⊱النظام        » ${systemInfo.os}
⊱نسخة Node     » ${systemInfo.node}
⊱المعالج       » ${systemInfo.cpu}
⊱الذاكرة الحرة » ${systemInfo.storage}
⊱استخدام المعالج » ${systemInfo.cpuUsage}
⊱استخدام الرام » ${systemInfo.ramUsage}

⟡────── ⊱𝑶𝑻𝑯𝑬𝑹 ──────⟡
⊱التاريخ    » ${otherInfo.date}
⊱الوقت      » ${otherInfo.time}
⊱المستخدمين » ${otherInfo.users}
⊱المجموعات  » ${otherInfo.threads}
⊱زمن الاستجابة » ${otherInfo.ping}
⊱الحالة      » ${otherInfo.status}
⟡─────────────────────⟡
`;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('❌ حدث خطأ أثناء جلب المعلومات', processingID);
    }
  },
};
