const axios = require('axios');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');
const path = require('path');

function setupImageEditClient() {
  try {
    const timestamp = Date.now();
    const anonymousId = uuidv4();
    const sboxGuid = Buffer.from(`\${timestamp}|\${Math.floor(Math.random() * 1000)}|\${Math.floor(Math.random() * 1000000000)}\`).toString('base64');
    
    const cookies = [
      \`anonymous_user_id=\${anonymousId}\`,
      \`i18n_redirected=en\`,
      \`_ga_PFX3BRW5RQ=GS2.1.s\${timestamp}$o1$g0$t\${timestamp}$j60$l0$h\${timestamp + 100000}\`,
      \`_ga=GA1.1.\${Math.floor(Math.random() * 2000000000)}.\${timestamp}\`,
      \`sbox-guid=\${sboxGuid}\`
    ].join('; ');
    
    return axios.create({
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      }
    });
  } catch (error) {
    throw error;
  }
}

async function getStsToken(client) {
  try {
    const response = await client.get('https://notegpt.io/api/v1/oss/sts-token', {
      headers: {
        'accept': '*/*',
        'x-token': ''
      }
    });
    
    if (response.data.code === 100000) {
      return response.data.data;
    } else {
      throw new Error('فشل في الحصول على STS Token');
    }
  } catch (error) {
    throw error;
  }
}

async function uploadImageToOSS(imageUrl, stsData) {
  try {
    const fileName = \`\${uuidv4()}.jpg\`;
    const ossPath = \`notegpt/web3in1/\${fileName}\`;
    
    const ossClient = new OSS({
      region: 'oss-us-west-1',
      accessKeyId: stsData.AccessKeyId,
      accessKeySecret: stsData.AccessKeySecret,
      stsToken: stsData.SecurityToken,
      bucket: 'nc-cdn'
    });
    
    const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
    const result = await ossClient.putStream(ossPath, imageResponse.data);
    
    return \`https://nc-cdn.oss-us-west-1.aliyuncs.com/\${ossPath}\`;
  } catch (error) {
    throw error;
  }
}

async function startImageEdit(client, imageUrl, prompt) {
  try {
    const response = await client.post('https://notegpt.io/api/v2/images/handle', {
      "image_url": imageUrl,
      "type": 60,
      "user_prompt": prompt,
      "aspect_ratio": "match_input_image",
      "num": 4,
      "model": "google/nano-banana",
      "sub_type": 3
    }, {
      headers: { 'accept': 'application/json, text/plain, */*' }
    });
    
    if (response.data.code === 100000) {
      return response.data.data.session_id;
    } else {
      throw new Error('فشل في بدء تحرير الصورة');
    }
  } catch (error) {
    throw error;
  }
}

async function trackEditingStatus(client, sessionId) {
  try {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const response = await client.get(\`https://notegpt.io/api/v2/images/status?session_id=\${sessionId}\`, {
        headers: { 'accept': 'application/json, text/plain, */*' }
      });
      
      if (response.data.code === 100000) {
        const status = response.data.data.status;
        
        if (status === 'succeeded') return response.data.data.results;
        else if (status === 'failed') throw new Error('فشل في تحرير الصورة');
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    throw new Error('انتهت مهلة انتظار تحرير الصورة');
  } catch (error) {
    throw error;
  }
}

module.exports = {
  config: {
    name: "تعديل",
    version: "1.0",
    author: "AYOUB",
    countDown: 10,
    prefix: true,
    description: "تعديل الصور باستخدام AI",
    category: "ذكاء اصطناعي",
    guide: {
      en: 'رد على صورة واكتب: {pn} <وصف التعديل>'
    }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, messageReply, senderID } = event;
    
    if (event.type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("الرجاء الرد على صورة لتعديلها.", threadID, messageID);
    }
    
    const attachment = messageReply.attachments[0];
    if (attachment.type !== "photo") {
      return api.sendMessage("هذا المرفق ليس صورة. يرجى الرد على صورة فقط.", threadID, messageID);
    }
    
    const prompt = args.join(" ").trim();
    if (!prompt) {
      return api.sendMessage("الرجاء إضافة وصف للتعديل بعد اسم الأمر. مثال: تعديل اجعلها كرتونية", threadID, messageID);
    }
    
    const infoMsg = await api.sendMessage("🎨 جاري الاتصال بخوادم الذكاء الاصطناعي... يرجى الانتظار قليلاً.", threadID, messageID);
    const processingID = infoMsg.messageID;
    
    const uniqueId = \`\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    const cacheDir = path.join(__dirname, "cache");
    
    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      const client = setupImageEditClient();
      
      await api.editMessage("📤 جاري رفع الصورة وتجهيزها...", processingID);
      const stsData = await getStsToken(client);
      const uploadedImageUrl = await uploadImageToOSS(attachment.url, stsData);
      
      await api.editMessage("⚙️ جاري معالجة الصورة في خوادم المعالجة...", processingID);
      const sessionId = await startImageEdit(client, uploadedImageUrl, prompt);
      
      await api.editMessage("⏳ البوت يقوم الآن برسم التعديلات المطلوبة...", processingID);
      const results = await trackEditingStatus(client, sessionId);
      
      await api.editMessage("📥 جاري تحميل الصور النهائية وإرسالها إليك...", processingID);
      
      const editedImages = [];
      const filesToDelete = [];
      
      for (let i = 0; i < results.length; i++) {
        const imageUrl = results[i].url;
        const filePath = path.join(cacheDir, \`edited_\${uniqueId}_\${i + 1}.png\`);
        
        const response = await axios.get(imageUrl, { responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        editedImages.push(fs.createReadStream(filePath));
        filesToDelete.push(filePath);
      }
      
      if (editedImages.length === 0) {
        return api.editMessage("❌ عذراً، فشل النظام في معالجة الصور المحررة.", processingID);
      }
      
      await api.sendMessage({
        body: "✨ تم الانتهاء من تعديل الصورة بنجاح!",
        attachment: editedImages
      }, threadID, messageID);
      
      // Cleanup
      api.unsendMessage(processingID);
      setTimeout(() => {
        filesToDelete.forEach(file => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        });
      }, 5000);
      
    } catch (error) {
      console.error("Image Edit Error:", error);
      api.editMessage(\`❌ حدث خطأ غير متوقع: \${error.message}\`, processingID);
    }
  }
};
