const axios = require('axios');

module.exports = {
  config: {
    name: "تحدي",
    version: "1.1",
    author: "Kenji Cloud",
    countDown: 5,
    prefix: true,
    description: "تحدي المعلومات العامة العالمية",
    category: "ألعاب",
    guide: {
      en: '{pn}'
    }
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID } = event;
    try {
      const response = await axios.get('https://opentdb.com/api.php?amount=1&category=9&type=multiple');
      const data = response.data.results[0];
      const question = data.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
      const correctAnswer = data.correct_answer;
      const options = [...data.incorrect_answers, correctAnswer].sort(() => Math.random() - 0.5);
      const msg = `╭─── 『 🌍 تحدي المعرفة 』 ───╮\n  ${question}\n╰───────────────────╯\n\n📋 الاختيارات:\n${options.map((opt, i) => `◽ ${i + 1}. ${opt}`).join('\n')}\n\n⏱️ رد بالرقم الصحيح.`;
      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          correctAnswer: options.indexOf(correctAnswer) + 1
        });
      }, messageID);
    } catch (e) {
      return api.sendMessage("❌ عذراً، خطأ في الخادم.", threadID, messageID);
    }
  },

  handleReply: async function({ api, event, handleReply }) {
    if (handleReply.author !== event.senderID) return;
    if (event.body == handleReply.correctAnswer) {
      api.unsendMessage(handleReply.messageID);
      return api.sendMessage("🏆 مذهل! إجابة صحيحة.", event.threadID, event.messageID);
    } else {
      return api.sendMessage("🔻 إجابة خاطئة.", event.threadID, event.messageID);
    }
  }
};
