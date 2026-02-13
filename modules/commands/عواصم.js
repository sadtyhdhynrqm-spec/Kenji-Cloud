const axios = require('axios');

module.exports = {
  config: {
    name: "عواصم",
    version: "1.0",
    author: "Kenji Cloud",
    countDown: 5,
    prefix: true,
    description: "لعبة عواصم الدول العالمية",
    category: "ألعاب",
    guide: { en: '{pn}' }
  },

  onStart: async function({ api, event }) {
    try {
      const response = await axios.get('https://restcountries.com/v3.1/all');
      const countries = response.data.filter(c => c.capital && c.capital[0]);
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      const countryName = randomCountry.name.common;
      const correctAnswer = randomCountry.capital[0];
      
      const msg = `╭─── 『 🏛️ عواصم العالم 』 ───╮\n  ما هي عاصمة دولة: ${countryName}؟\n╰────────────────────╯\n\n💬 رد على الرسالة باسم العاصمة.`;
      
      return api.sendMessage(msg, event.threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          correctAnswer: correctAnswer.toLowerCase()
        });
      }, event.messageID);
    } catch (e) {
      return api.sendMessage("❌ فشل في جلب السؤال.", event.threadID, event.messageID);
    }
  },

  handleReply: async function({ api, event, handleReply }) {
    if (handleReply.author !== event.senderID) return;
    if (event.body.toLowerCase() === handleReply.correctAnswer) {
      api.unsendMessage(handleReply.messageID);
      return api.sendMessage("✅ إجابة صحيحة! عاصمة رائعة.", event.threadID, event.messageID);
    } else {
      return api.sendMessage(`❌ خطأ! العاصمة الصحيحة هي: ${handleReply.correctAnswer}`, event.threadID, event.messageID);
    }
  }
};
