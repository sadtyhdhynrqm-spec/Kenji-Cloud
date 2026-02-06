const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "عيد", // اسم الأمر بالعربي
  version: "1.0",
  author: "Hridoy",
  countDown: 10,
  role: 0,
  prefix: false,
  description: "إرسال مقطع هدية من مسلسل Breaking Bad",
  category: "media"
};

module.exports.onStart = async ({ api, event }) => {
  const threadID = event.threadID;
  const videoId = "11XzPicMYnSiWAFBG80NO90Imx_tbAu_h";
  const videoUrl = `https://drive.google.com/uc?export=download&id=${videoId}`;

  try {
    const response = await axios.get(videoUrl, { responseType: "arraybuffer" });

    const tempDir = path.join(__dirname, "../../temp");
    await fs.ensureDir(tempDir);
    const filePath = path.join(tempDir, `عيد_${Date.now()}.mp4`);
    await fs.writeFile(filePath, Buffer.from(response.data));

    await api.sendMessage({
      body: "🎬 تفضل هديتك!",
      attachment: fs.createReadStream(filePath)
    }, threadID);

    await fs.unlink(filePath);
  } catch (err) {
    console.error("خطأ في أمر عيد:", err);
    api.sendMessage("❌ فشل في جلب أو إرسال الفيديو.", threadID);
  }
};
