const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "بنتراست",
    aliases: ["pin", "pint", "بن", "pinterest", "صور"],
    version: "1.0",
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
        "⚠️ الرجاء إدخال كلمة البحث!\n\n📝 مثال: بين cat 5",
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

    const query = args.join(" ");

    const waitMsg = await api.sendMessage(
      `🔍 جاري البحث عن "${query}"...\n⏳ الرجاء الانتظار...`,
      threadID,
      replyID
    );

    const processingID = waitMsg.messageID;

    try {
      const params = {
        data: JSON.stringify({
          options: {
            query,
            scope: "pins",
            page_size: 200
          },
          context: {}
        }),
        _: Date.now()
      };

      const { data } = await axios.get(
        "https://www.pinterest.com/resource/BaseSearchResource/get/",
        {
          headers: {
            "accept": "application/json",
            "x-pinterest-appstate": "active",
            "x-pinterest-source-url": `/search/pins/?q=${encodeURIComponent(query)}`,
            "user-agent": "Mozilla/5.0"
          },
          params
        }
      );

      const jsonString = JSON.stringify(data);
      const imageRegex =
        /https:\/\/i\.pinimg\.com\/(736|1200)x\/[^\s"]+\.(jpg|png|webp)/gi;

      const images = jsonString.match(imageRegex);

      if (!images || images.length === 0) {
        return api.editMessage(
          `❌ لم يتم العثور على صور لـ "${query}"`,
          processingID
        );
      }

      const uniqueImages = [...new Set(images)].slice(0, count);
      const attachments = [];

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      for (let i = 0; i < uniqueImages.length; i++) {
        const imgPath = path.join(
          cacheDir,
          `pinterest_${Date.now()}_${i}.jpg`
        );

        const res = await axios.get(uniqueImages[i], {
          responseType: "stream"
        });

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

      // تنظيف الكاش
      setTimeout(() => {
        fs.readdir(cacheDir, (err, files) => {
          if (err) return;
          files.forEach(file => {
            if (file.startsWith("pinterest_")) {
              fs.unlink(path.join(cacheDir, file), () => {});
            }
          });
        });
      }, 5000);

    } catch (err) {
      console.error("Pinterest Error:", err);
      api.editMessage(
        "❌ حدث خطأ أثناء البحث عن الصور",
        processingID
      );
    }
  }
};
