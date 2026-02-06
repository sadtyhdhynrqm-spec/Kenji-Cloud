const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "كرت",
    aliases: ["card"],
    version: "3.1",
    author: "Hridoy | Arabized by You",
    countDown: 5,
    prefix: true,
    description: "عرض معلومات المستخدم في بطاقة أنيقة",
    category: "أدوات",
    guide: {
      ar: "{pn}كرت [منشن | رد | UID]"
    }
  },

  onStart: async ({ api, event, args }) => {
    try {
      let uid = event.senderID;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        uid = event.messageReply.senderID;
      } else if (args[0] && !isNaN(args[0])) {
        uid = args[0];
      }

      const userInfo = await api.getUserInfo(uid);
      const user = userInfo[uid];

      if (!user) {
        return api.sendMessage("❌ لم يتم العثور على المستخدم.", event.threadID);
      }

      const name = user.name || "غير معروف";
      const gender =
        user.gender === 2 ? "ذكر" :
        user.gender === 1 ? "أنثى" :
        "غير محدد";

      const isFriend = user.isFriend ? "نعم ✅" : "لا ❌";
      const username = user.vanity || "لا يوجد";

      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      const avatarPath = path.join(__dirname, "cache", `${uid}.png`);
      await fs.ensureDir(path.dirname(avatarPath));

      const avatar = await axios.get(avatarURL, { responseType: "arraybuffer" });
      await fs.writeFile(avatarPath, avatar.data);

      const canvas = createCanvas(500, 600);
      const ctx = canvas.getContext("2d");

      // الخلفية
      ctx.fillStyle = "#1a202c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // الصورة
      const img = await loadImage(avatarPath);
      ctx.save();
      ctx.beginPath();
      ctx.arc(250, 130, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 180, 60, 140, 140);
      ctx.restore();

      // الاسم
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.fillText(name, 250, 230);

      // المعلومات
      ctx.font = "18px Arial";
      ctx.fillText(`🆔 ID: ${uid}`, 250, 280);
      ctx.fillText(`👤 الجنس: ${gender}`, 250, 320);
      ctx.fillText(`🔗 اسم المستخدم: ${username}`, 250, 360);
      ctx.fillText(`🤝 صديق البوت: ${isFriend}`, 250, 400);

      const outputPath = path.join(__dirname, "cache", "card.png");
      await fs.writeFile(outputPath, canvas.toBuffer("image/png"));

      api.sendMessage(
        {
          body: `✨ بطاقة معلومات ${name}`,
          attachment: fs.createReadStream(outputPath)
        },
        event.threadID,
        () => {
          fs.unlinkSync(outputPath);
          fs.unlinkSync(avatarPath);
        }
      );

    } catch (err) {
      console.error("[CARD ERROR]", err);
      api.sendMessage("❌ حدث خطأ أثناء إنشاء البطاقة.", event.threadID);
    }
  }
};
