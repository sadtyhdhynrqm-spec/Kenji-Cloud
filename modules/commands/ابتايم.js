const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'ابتايم ',
    version: '1.1',
    author: 'Hridoy',
    description: 'Sends system, uptime, and other info by editing a single message',
    countDown: 5,
    prefix: true,
    category: 'utility',
  },
  onStart: async ({ api, event }) => {
    try {
      // ====== Send initial loading message ======
      const loadingMessage = await api.sendMessage('⏳ ⊱𝑳𝑶𝑨𝑫𝑰𝑵𝑮 𝑺𝒀𝑺𝑻𝑬𝑴 𝑰𝑵𝑭𝑶...', event.threadID);

      // ====== Uptime ======
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / (24 * 3600));
      const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // ====== System Info ======
      const systemInfo = {
        os: `${os.type()} ${os.arch()}`,
        node: process.version,
        cpu: os.cpus()[0].model,
        storage: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        cpuUsage: (process.cpuUsage().user / 1000000).toFixed(2) + ' %',
        ramUsage: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
      };

      // ====== Other Info ======
      const otherInfo = {
        date: moment().format('MMM D, YYYY'),
        time: moment().format('hh:mm:ss A'),
        users: global.users?.length || 0,
        threads: global.threads?.length || 0,
        ping: Math.floor(performance.now()) + 'ms',
        status: '⚠️ | ⊱𝑴𝗈𝖽𝖾𝗋𝖺𝗍𝖾 ⊱𝑳𝗈𝖺𝖽',
      };

      // ====== Formatted Message ======
      const finalMessage = `
♡  ∩_∩
（„• ֊ •„)♡©
╭─∪∪────────────⟡
│ ⊱𝑼𝑷𝑻𝑰𝑴𝑬 ⊱𝑰𝑵𝑭𝑶
├───────────────⟡
│ ⏰ ⊱𝑹𝑼𝑵𝑻𝑰𝑴𝑬
│  ${uptime}
├───────────────⟡
│ 👑 ⊱𝑺𝒀𝑺𝑻𝑬𝑴 ⊱𝑰𝑵𝑭𝑶
│⊱𝑶𝑺: ${systemInfo.os}
│⊱𝑳𝑨𝑵𝑮 ⊱𝑽𝑬𝑹: ${systemInfo.node}
│⊱𝑪𝑷𝑼 ⊱𝑴𝑶𝑫𝑬𝑳: ${systemInfo.cpu}
│⊱𝑺𝑻𝑶𝑹𝑨𝑮𝑬: ${systemInfo.storage}
│⊱𝑪𝑷𝑼 ⊱𝑼𝑺𝑨𝑮𝑬: ${systemInfo.cpuUsage}
│⊱𝑹𝑨𝑴 ⊱𝑼𝑺𝑮𝑬: ${systemInfo.ramUsage}
├───────────────⟡
│ ✅ ⊱𝑶𝑻𝑯𝑬𝑹 ⊱𝑰𝑵𝑭𝑶
│⊱𝑫𝑨𝑻𝑬: ${otherInfo.date}
│⊱𝑻𝑰𝑴𝑬: ${otherInfo.time}
│⊱𝑼𝑺𝑬𝑹𝑺: ${otherInfo.users}
│⊱𝑻𝑯𝑹𝑬𝑨𝑫𝑺: ${otherInfo.threads}
│⊱𝑷𝑰𝑵𝑮: ${otherInfo.ping}
│⊱𝑺𝑻𝑨𝑻𝑼𝑺: ${otherInfo.status}
╰───────────────⟡
`;

      // ====== Edit initial message with final info ======
      setTimeout(() => {
        api.editMessage(finalMessage, loadingMessage.messageID, event.threadID);
      }, 2000); // 2 seconds delay
    } catch (error) {
      console.error('Error sending sysinfo:', error);
      api.sendMessage('حدث خطأ أثناء جلب المعلومات ⚠️', event.threadID);
    }
  },
};
