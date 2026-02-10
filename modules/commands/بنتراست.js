const axios = require("axios");
const fs = require("fs");
const path = require("path");
const request = require("request");

module.exports = {
  config: {
    name: "بنتراست",
    aliases: ["pin", "pint", "بن", "pinterest", "صور"],
    version: "1.2",
    author: "YourName",
    description: "البحث عن صور من Pinterest",
    countDown: 5,
    prefix: true,
    category: "بحث",
    adminOnly: false
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const replyID = event.messageID;

    if (!args.length) {
      return api.sendMessage(
        "⚠️ الرجاء إدخال كلمة البحث!\n\n📝 مثال: بين cat - 5",
        threadID,
        replyID
      );
    }

    let count = 8;
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg)) {
      count = Math.min(parseInt(lastArg), 20);
      args.pop();
    }

    const query = args.join(" ").trim();

    const waitMsg = await api.sendMessage(
      `🔍 جاري البحث عن "${query}"...\n⏳ الرجاء الانتظار...`,
      threadID,
      replyID
    );

    const processingID = waitMsg.messageID;

    try {
      const headers = {
        'authority': 'www.pinterest.com',
        'cache-control': 'max-age=0',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': 'csrftoken=92c7c57416496066c4cd5a47a2448e28;' // ممكن تحط cookies أصلية هنا إذا لازم
      };

      const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed&term_meta[]=${encodeURIComponent(query)}%7Ctyped`;

      request({ url, headers }, async (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const matches = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);

          if (!matches || matches.length === 0) {
            return api.editMessage(`❌ لم يتم العثور على صور لـ "${query}"`, processingID);
          }

          const uniqueImages = [...new Set(matches)].slice(0, count);
          const attachments = [];

          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

          for (let i = 0; i < uniqueImages.length; i++) {
            const imgPath = path.join(cacheDir, `pinterest_${Date.now()}_${i}.jpg`);
            const res = await axios.get(uniqueImages[i], { responseType: "stream" });
            const writer = fs.createWriteStream(imgPath);
            res.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });
            attachments.push(fs.createReadStream(imgPath));
          }

          await api.editMessage(
            {
              body: `✅ تم العثور على ${attachments.length} صورة لـ "${query}"`,
              attachment: attachments
            },
            processingID
          );

          // تنظيف الكاش بعد 5 ثواني
          setTimeout(() => {
            fs.readdir(cacheDir, (err, files) => {
              if (err) return;
              files.forEach(file => {
                if (file.startsWith("pinterest_")) fs.unlinkSync(path.join(cacheDir, file));
              });
            });
          }, 5000);

        } else {
          api.editMessage("❌ حدث خطأ أثناء البحث عن الصور", processingID);
        }
      });

    } catch (err) {
      console.error("Pinterest Error:", err);
      api.editMessage("❌ حدث خطأ أثناء البحث عن الصور", processingID);
    }
  }
};
