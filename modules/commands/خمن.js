const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'خمن', // تم تغيير اسم الأمر
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'خمن الدولة بناءً على التلميح',
    category: 'لعب',
    guide: {
      ar: '{pn}خمن'
    }
  },

  onStart: async ({ api, event }) => {
    const { threadID, senderID } = event;

    try {
      const res = await axios.get('https://sus-apis-2.onrender.com/api/guess-country');
      const data = res.data;

      if (!data.success) {
        return api.sendMessage('❌ لم أتمكن من جلب بيانات الدولة. حاول لاحقاً.', threadID);
      }

      const clue = data.clue;
      const options = data.options;
      const answer = data.answer;

      const optionText = `a) ${options[0]}\nb) ${options[1]}\nc) ${options[2]}\nd) ${options[3]}`;

      const message = `🌍 مسابقة الدولة\n\n🧩 التلميح: ${clue}\n\n${optionText}\n\nقم بالرد بـ a أو b أو c أو d للإجابة.`;

      const sentMsg = await api.sendMessage(message, threadID);

      global.client.handleReply.push({
        name: 'خمن',
        messageID: sentMsg.messageID,
        threadID,
        senderID,
        correctAnswer: answer.name,
        correctIndex: options.indexOf(answer.name),
        flagUrl: answer.flag_url,
        timeout: setTimeout(async () => {
          const idx = global.client.handleReply.findIndex(e => e.messageID === sentMsg.messageID && e.name === 'خمن');
          if (idx >= 0) global.client.handleReply.splice(idx, 1);
          await api.sendMessage('⏰ انتهى الوقت! لم تجب.', threadID);
        }, 60000)
      });

      log('info', `تم إرسال مسابقة الدولة إلى ${senderID} في المحادثة ${threadID}`);

    } catch (error) {
      log('error', `خطأ في خمن: ${error.message}`);
      api.sendMessage('❌ فشل بدء مسابقة الدولة. حاول لاحقاً.', threadID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const reply = event.body.trim().toLowerCase();
    const { threadID, senderID, messageID } = event;

    if (!event.messageReply || event.messageReply.messageID !== handleReply.messageID) {
      return api.sendMessage('⚠️ هذا الرد ليس على مسابقة الدولة.', threadID, messageID);
    }

    if (!['a', 'b', 'c', 'd'].includes(reply)) {
      return api.sendMessage('⚠️ الرجاء الرد بـ "a" أو "b" أو "c" أو "d" فقط.', threadID, messageID);
    }

    const idx = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID && e.name === 'خمن');
    if (idx >= 0) {
      clearTimeout(global.client.handleReply[idx].timeout);
      global.client.handleReply.splice(idx, 1);
    }

    const userAnswerIndex = { a: 0, b: 1, c: 2, d: 3 }[reply];
    const correct = userAnswerIndex === handleReply.correctIndex;

    try {
      const response = await axios.get(handleReply.flagUrl, { responseType: 'arraybuffer' });
      const cacheDir = path.join(__dirname, '..', 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const imgPath = path.join(cacheDir, `علم_الدولة_${Date.now()}.png`);
      fs.writeFileSync(imgPath, Buffer.from(response.data, 'binary'));

      const resultMsg = correct
        ? `✅ صحيح! الدولة هي **${handleReply.correctAnswer}**.`
        : `❌ خطأ! الإجابة الصحيحة هي **${handleReply.correctAnswer}**.`;

      await api.sendMessage({
        body: resultMsg,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => fs.unlinkSync(imgPath));

      log('info', `المستخدم ${senderID} أجاب "${reply}" (${correct ? 'صحيح' : 'خطأ'}) في مسابقة الدولة`);

    } catch (error) {
      log('error', `خطأ أثناء إرسال صورة العلم: ${error.message}`);
      await api.sendMessage(
        correct
          ? `✅ صحيح! الدولة هي **${handleReply.correctAnswer}**.`
          : `❌ خطأ! الإجابة الصحيحة هي **${handleReply.correctAnswer}**.`,
        threadID
      );
    }
  }
};
