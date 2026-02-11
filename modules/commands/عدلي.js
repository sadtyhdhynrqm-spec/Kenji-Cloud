const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

function setupImageEditClient() {
    const timestamp = Date.now();
    const anonymousId = uuidv4();
    const sboxGuid = Buffer.from(`${timestamp}|${Math.floor(Math.random() * 1000)}|${Math.floor(Math.random() * 1000000000)}`).toString('base64');

    const cookies = [
        `anonymous_user_id=${anonymousId}`,
        `i18n_redirected=en`,
        `_ga_PFX3BRW5RQ=GS2.1.s${timestamp}$o1$g0$t${timestamp}$j60$l0$h${timestamp + 100000}`,
        `_ga=GA1.1.${Math.floor(Math.random() * 2000000000)}.${timestamp}`,
        `sbox-guid=${sboxGuid}`
    ].join('; ');

    return axios.create({
        headers: {
            'Cookie': cookies,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        }
    });
}

async function getStsToken(client) {
    const response = await client.get('https://notegpt.io/api/v1/oss/sts-token', {
        headers: { 'accept': '*/*', 'x-token': '' }
    });
    if (response.data.code === 100000) return response.data.data;
    throw new Error('فشل في الحصول على STS Token');
}

async function uploadImageToOSS(imageUrl, stsData) {
    const fileName = `${uuidv4()}.jpg`;
    const ossPath = `notegpt/web3in1/${fileName}`;
    const ossClient = new OSS({
        region: 'oss-us-west-1',
        accessKeyId: stsData.AccessKeyId,
        accessKeySecret: stsData.AccessKeySecret,
        stsToken: stsData.SecurityToken,
        bucket: 'nc-cdn'
    });
    const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
    await ossClient.putStream(ossPath, imageResponse.data);
    return `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;
}

async function startImageEdit(client, imageUrl, prompt) {
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
    if (response.data.code === 100000) return response.data.data.session_id;
    throw new Error('فشل في بدء تحرير الصورة');
}

async function trackEditingStatus(client, sessionId) {
    let attempts = 0;
    while (attempts < 30) {
        const response = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`, {
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
    throw new Error('انتهت مهلة الانتظار');
}

module.exports = {
    config: {
        name: "عدلي",
        version: "1.0",
        author: "AYOUB",
        prefix: true,
        description: "تعديل الصور باستخدام AI",
        category: "ai",
        guide: {
            en: "{pn} <وصف التعديل> والرد على صورة"
        }
    },

    onStart: async ({ api, event, args }) => {
        if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
            return api.sendMessage('•-• الرجاء الرد على صورة', event.threadID, event.messageID);
        }

        const attachment = event.messageReply.attachments[0];
        if (attachment.type !== 'photo') return api.sendMessage('•-• هذا ليس صورة', event.threadID, event.messageID);

        const prompt = args.join(' ').trim();
        if (!prompt) return api.sendMessage('•-• الرجاء إضافة وصف للتعديل', event.threadID, event.messageID);

        const infoMsg = await api.sendMessage('•-• 🎨 جاري تعديل الصورة...', event.threadID, event.messageID);
        const processingID = infoMsg.messageID;

        try {
            const cacheDir = __dirname + "/cache";
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            const client = setupImageEditClient();
            const stsData = await getStsToken(client);
            const uploadedImageUrl = await uploadImageToOSS(attachment.url, stsData);
            const sessionId = await startImageEdit(client, uploadedImageUrl, prompt);
            const results = await trackEditingStatus(client, sessionId);

            const editedImages = [];
            const filesToDelete = [];
            const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            for (let i = 0; i < results.length; i++) {
                const filePath = `${cacheDir}/edited_${uniqueId}_${i + 1}.png`;
                const response = await axios.get(results[i].url, { responseType: 'stream' });
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                editedImages.push(fs.createReadStream(filePath));
                filesToDelete.push(filePath);
            }

            await api.editMessage({ body: '•-• ✨ تم تعديل الصورة', attachment: editedImages }, processingID);
            setTimeout(() => filesToDelete.forEach(file => fs.existsSync(file) && fs.unlinkSync(file)), 3000);

        } catch (error) {
            await api.editMessage(`•-• ❌ حدث خطأ أثناء تعديل الصورة: ${error.message}`, processingID);
        }
    }
};
