const os = require('os');

module.exports = {
  config: {
    name: 'ابتايم ',
    version: '1.5',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    category: 'system',
    description: 'Displays system uptime and information with real-time update.',
  },

  onStart: async ({ api, event }) => {
    const startTime = Date.now();
    
    // إرسال رسالة جاري التحميل
    const infoMsg = await api.sendMessage('⏳ جاري جلب معلومات النظام...', event.threadID);
    const messageID = infoMsg.messageID;

    // حساب إحصائيات النظام
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const processUptime = process.uptime();
    const pDays = Math.floor(processUptime / (24 * 3600));
    const pHours = Math.floor((processUptime % (24 * 3600)) / 3600);
    const pMinutes = Math.floor((processUptime % 3600) / 60);
    const pSeconds = Math.floor(processUptime % 60);

    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    
    const cpuModel = os.cpus()[0].model;
    const platform = os.platform();
    const arch = os.arch();
    
    let groupCount = 0;
    try {
      const { Threads } = require('../../database/database');
      const allThreads = Threads.getAll() || {};
      groupCount = Object.keys(allThreads).length;
    } catch (e) {
      groupCount = 'N/A';
    }

    const ping = Date.now() - startTime;

    // تنسيق الرسالة المزخرفة
    const message = `
╭───────────────╮
    📊 معلومات النظام
╰───────────────╯
🔹 البنج: ${ping}ms
🔹 المجموعات: ${groupCount}
🔹 الرام: ${ramUsage}MB / ${totalRam}GB
🔹 المساحة الحرة: ${freeRam}GB
🔹 المعالج: ${cpuModel}
🔹 المنصة: ${platform} (${arch})
🔹 النظام: ${os.type()} ${os.release()}

╭───────────────╮
    ⏱️ وقت التشغيل
╰───────────────╯
⏳ النظام: ${days}d ${hours}h ${minutes}m ${seconds}s
⏳ البوت: ${pDays}d ${pHours}h ${pMinutes}m ${pSeconds}s

✨ Kenji Cloud AI ✨
    `.trim();

    // تعديل الرسالة نفسها لتصبح القائمة الكاملة
    return api.editMessage(message, messageID);
  }
};
