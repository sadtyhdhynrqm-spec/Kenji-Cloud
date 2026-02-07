const axios = require('axios');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'اسالة', // تم تغيير الاسم
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'لعبة أسئلة. يمكن اختيار الفئة أو تركها عشوائية.',
    category: 'game',
    guide: {
      en: '{pn}اسالة\n{pn}اسالة <الفئة>'
    }
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const senderID = event.senderID;
    let category = args.join(' ').trim();

    try {
      let quizData;

      if (category) {
        const catRes = await axios.get('https://bangla-quiz-db.vercel.app/api/categories');
        const categories = catRes.data.map(x => x.trim());
        if (!categories.includes(category)) {
          return api.sendMessage(
            '❌ من فضلك اختر فئة صحيحة.\nالفئات المتاحة: ' + categories.join(', '),
            threadID,
            event.messageID
          );
        }

        const quizRes = await axios.get(`https://bangla-quiz-db.vercel.app/api/random/${encodeURIComponent(category)}`);
        quizData = quizRes.data;
        if (!quizData || !quizData.question) {
          return api.sendMessage('❌ لا يوجد أسئلة لهذه الفئة.', threadID, event.messageID);
        }
      } else {
        const quizRes = await axios.get('https://bangla-quiz-db.vercel.app/api/random');
        quizData = quizRes.data;
      }

      const optionA = quizData.options1 || quizData.option1;
      const optionB = quizData.options2 || quizData.option2;
      const optionC = quizData.options3 || quizData.option3;
      const answerKey = quizData.answer;

      const quizMsg = `❓ [${quizData.category}] ${quizData.question}\n\nأ) ${optionA}\nب) ${optionB}\nج) ${optionC}\n\nللإجابة، رد على هذا الرسالة بأحد الخيارات: أ، ب، ج.`;
      const sentMsg = await api.sendMessage(quizMsg, threadID);

      global.client.handleReply.push({
        name: 'اسالة', // تم تغيير الاسم هنا أيضًا
        messageID: sentMsg.messageID,
        threadID,
        senderID,
        answerKey,
        options: [optionA, optionB, optionC],
        timeout: setTimeout(async () => {
          const idx = global.client.handleReply.findIndex(e => e.messageID === sentMsg.messageID && e.name === 'اسالة');
          if (idx >= 0) global.client.handleReply.splice(idx, 1);
          await api.sendMessage('⏰ انتهى الوقت! لم تقم بالإجابة.', threadID);
        }, 60000)
      });

      log('info', `Quiz أُرسل إلى ${senderID} في المجموعة ${threadID}`);

    } catch (error) {
      log('error', `حدث خطأ في أمر الكويز: ${error.message}`);
      api.sendMessage('❌ حدثت مشكلة أثناء جلب السؤال. حاول لاحقًا!', threadID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const reply = event.body.trim().toLowerCase();
    const threadID = event.threadID;
    const senderID = event.senderID;

    if (!event.messageReply || event.messageReply.messageID !== handleReply.messageID) {
      return api.sendMessage('⚠️ هذا الرد ليس على سؤال الكويز الخاص بي!', threadID, event.messageID);
    }

    const validReplies = { 'أ': 0, 'ب': 1, 'ج': 2 };
    if (!validReplies.hasOwnProperty(reply)) {
      return api.sendMessage('⚠️ استخدم فقط: أ، ب، ج للإجابة!', threadID, event.messageID);
    }

    const idx = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID && e.name === 'اسالة');
    if (idx >= 0) {
      clearTimeout(global.client.handleReply[idx].timeout);
      global.client.handleReply.splice(idx, 1);
    }

    const userOptionIdx = validReplies[reply];
    const answerMap = { 'options1': 0, 'option1': 0, 'options2': 1, 'option2': 1, 'options3': 2, 'option3': 2 };
    const correctIdx = answerMap[handleReply.answerKey];

    if (userOptionIdx === correctIdx) {
      await api.sendMessage('✅ إجابة صحيحة! 🎉', threadID, event.messageID);
    } else {
      await api.sendMessage(`❌ إجابة خاطئة!\nالإجابة الصحيحة: ${handleReply.options[correctIdx]}`, threadID, event.messageID);
    }

    log('info', `المستخدم ${senderID} أجاب "${reply}" على الكويز في المجموعة ${threadID}. صحيح: ${userOptionIdx === correctIdx}`);
  }
};
