const axios = require('axios');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'اسالة2', // تغيير اسم الأمر
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'لعبة أسئلة صعبة بأربع خيارات.',
    category: 'game',
    guide: {
      en: '{pn}اسالة2'
    }
  },

  onStart: async ({ api, event }) => {
    const { threadID, senderID } = event;

    try {
      const res = await axios.get('https://sus-apis-2.onrender.com/api/quiz?amount=1&difficulty=hard&type=multiple');
      const questionData = res.data?.data?.questions?.[0];

      if (!res.data.success || !questionData) {
        return api.sendMessage('❌ لم أتمكن من تحميل السؤال. حاول لاحقًا.', threadID);
      }

      // ترتيب الخيارات عشوائياً
      const options = [...questionData.incorrectAnswers, questionData.correctAnswer];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      const correctIndex = options.indexOf(questionData.correctAnswer);

      const cleanCategory = questionData.category.replace(/&amp;/g, '&');
      const question = questionData.question;

      const optionText = `أ) ${options[0]}\nب) ${options[1]}\nج) ${options[2]}\nد) ${options[3]}`;

      const quizMsg = `🧠 أسئلة صعبة: [${cleanCategory}]\n\n❓ ${question}\n\n${optionText}\n\nللإجابة، رد على هذه الرسالة بأحد الخيارات: أ، ب، ج، د.`;

      const sentMsg = await api.sendMessage(quizMsg, threadID);

      global.client.handleReply.push({
        name: 'اسالة2',
        messageID: sentMsg.messageID,
        threadID,
        senderID,
        correctIndex,
        options,
        timeout: setTimeout(async () => {
          const idx = global.client.handleReply.findIndex(e => e.messageID === sentMsg.messageID && e.name === 'اسالة2');
          if (idx >= 0) global.client.handleReply.splice(idx, 1);
          await api.sendMessage('⏰ انتهى الوقت! لم تقم بالإجابة.', threadID);
        }, 60000) // دقيقة واحدة للرد
      });

      log('info', `Hard quiz أُرسل إلى ${senderID} في المجموعة ${threadID}`);

    } catch (error) {
      log('error', `حدث خطأ أثناء جلب السؤال: ${error.message}`);
      api.sendMessage('❌ فشل تحميل السؤال. حاول لاحقًا.', threadID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const reply = event.body.trim().toLowerCase();
    const { threadID, senderID, messageID } = event;

    if (!event.messageReply || event.messageReply.messageID !== handleReply.messageID) {
      return api.sendMessage('⚠️ هذا الرد ليس على السؤال الخاص بي!', threadID, messageID);
    }

    const validReplies = { 'أ': 0, 'ب': 1, 'ج': 2, 'د': 3 };
    if (!validReplies.hasOwnProperty(reply)) {
      return api.sendMessage('⚠️ استخدم فقط: أ، ب، ج، د للإجابة!', threadID, messageID);
    }

    const idx = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID && e.name === 'اسالة2');
    if (idx >= 0) {
      clearTimeout(global.client.handleReply[idx].timeout);
      global.client.handleReply.splice(idx, 1);
    }

    const userIndex = validReplies[reply];
    const correctAnswer = handleReply.options[handleReply.correctIndex];

    if (userIndex === handleReply.correctIndex) {
      await api.sendMessage('✅ إجابة صحيحة! 🎉', threadID, messageID);
    } else {
      await api.sendMessage(`❌ إجابة خاطئة!\nالإجابة الصحيحة: ${correctAnswer}`, threadID, messageID);
    }

    log('info', `المستخدم ${senderID} أجاب "${reply}" على اسالة2 في المجموعة ${threadID}. صحيح: ${userIndex === handleReply.correctIndex}`);
  }
};
