const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "صور",
    aliases: ["بنترست"],
    version: "1.0.2",
    author: "𝙸𝙷𝙰𝙱",
    countDown: 0,
    prefix: false, // يشتغل بدون بادئة
    description: "أبحث عن الصور في بنترست",
    category: "utility",
  },

  onStart: async ({ api, event, args }) => {
    try {
      const threadID = event.threadID;
      const keySearch = args.join(" ");
      if (!keySearch) {
        return api.sendMessage(
          `🔍| يرجى إدخال كلمة البحث وعدد الصور المراد استردادها بالشكل التالي:\n#صور <كلمة البحث> -<عدد الصور>`,
          threadID
        );
      }

      // استخراج الكلمة وعدد الصور
      const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim() || keySearch;
      const numberSearch = parseInt(keySearch.split("-").pop().trim()) || 4;

      // جلب الصور من API
      const res = await axios.get(`https://pinterest-ashen.vercel.app/api?search=${encodeURIComponent(keySearchs)}`);
      const data = res.data.data;
      const imgData = [];

      for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
        const imgResponse = await axios.get(data[i], { responseType: 'arraybuffer' });
        const imgPath = path.join(__dirname, 'tmp', `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push(fs.createReadStream(imgPath));
      }

      // إرسال الصور
      await api.sendMessage({
        attachment: imgData,
        body: `🎏| إليك أفضل ${imgData.length} نتائج الصور لـ "${keySearchs}":`
      }, threadID);

      // حذف الملفات المؤقتة
      await fs.remove(path.join(__dirname, 'tmp'));
    } catch (err) {
      console.error('خطأ في أمر صور:', err);
      api.sendMessage(
        `❌ حصل خطأ أثناء تنفيذ الأمر\nمثال: #صور قطة -10`,
        event.threadID
      );
    }
  }
};
