const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

module.exports = {
  config: {
    name: "بنتراست",
    aliases: ["pin", "pint", "بن", "pinterest", "صور"],
    version: "2.1.0",
    author: "YourName",
    description: "البحث عن صور من Pinterest",
    countDown: 5,
    prefix: true,
    category: "بحث",
    adminOnly: false
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const messageID = event.messageID;

    // 🔂 تفاعل عند بداية الطلب
    await api.setMessageReaction("🔂", messageID, () => {}, true);

    if (!args.length) {
      await api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        "⚠️ مثال الاستخدام:\nبن cat - 5",
        threadID,
        messageID
      );
    }

    // عدد الصور
    let count = 6;
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg)) {
      count = Math.min(parseInt(lastArg), 20);
      args.pop();
    }

    const query = args.join(" ").trim();
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    // ====== Scraping Pinterest ======
    const scrapePinterest = () =>
      new Promise((resolve, reject) => {
        const headers = {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "accept-language": "en-US,en;q=0.9"
        };

        const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

        request({ url, headers }, (err, res, body) => {
          if (err || res.statusCode !== 200) return reject();

          const images = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^"]+\.jpg/g);
          if (!images || !images.length) return reject();

          resolve([...new Set(images)].slice(0, count));
        });
      });

    // ====== API بديل ======
    const apiPinterest = async () => {
      const res = await axios.get(
        `https://pinterest-ashen.vercel.app/api?search=${encodeURIComponent(query)}`
      );
      return res.data.data.slice(0, count);
    };

    try {
      let images = [];

      try {
        images = await scrapePinterest();
      } catch {
        images = await apiPinterest();
      }

      if (!images.length) {
        await api.setMessageReaction("❌", messageID, () => {}, true);
        return;
      }

      const attachments = [];

      for (let i = 0; i < images.length; i++) {
        const imgPath = path.join(cacheDir, `pin_${Date.now()}_${i}.jpg`);
        const img = await axios.get(images[i], { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, img.data);
        attachments.push(fs.createReadStream(imgPath));
      }

      // ✅ نجاح
      await api.setMessageReaction("✅", messageID, () => {}, true);

      await api.sendMessage(
        {
          body: `📸 نتائج البحث: "${query}"`,
          attachment: attachments
        },
        threadID,
        messageID
      );

      // تنظيف الكاش
      setTimeout(() => {
        fs.readdirSync(cacheDir).forEach(file => {
          if (file.startsWith("pin_")) {
            fs.unlinkSync(path.join(cacheDir, file));
          }
        });
      }, 5000);

    } catch (err) {
      console.error("Pinterest Error:", err);
      await api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
