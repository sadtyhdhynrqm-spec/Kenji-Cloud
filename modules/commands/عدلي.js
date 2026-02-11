const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
    config: {
        name: 'عدلي',
        version: '1.0',
        author: 'محمد',
        countDown: 3,
        prefix: true,
        groupAdminOnly: false,
        description: 'تعديل الصور باستخدام AI',
        category: 'ai',
        guide: {
            en: '{pn} <وصف التعديل> والرد على صورة'
        }
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        // تحقق من الرد على صورة
        if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
            return api.sendMessage('•-• الرجاء الرد على صورة', threadID, messageID);
        }

        const attachment = event.messageReply.attachments[0];
        if (attachment.type !== 'photo') return api.sendMessage('•-• هذا ليس صورة', threadID, messageID);

        const prompt = args.join(' ').trim();
        if (!prompt) return api.sendMessage('•-• الرجاء إضافة وصف للتعديل', threadID, messageID);

        const infoMsg = await api.sendMessage('•-• 🎨 جاري تعديل الصورة...', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            // إعداد مجلد مؤقت
            const cacheDir = __dirname + "/cache";
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            // تهيئة العميل
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
            const client = axios.create({
                headers: {
                    'Cookie': cookies,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
                }
            });

            // الحصول على STS Token
            const stsRes = await client.get('https://notegpt.io/api/v1/oss/sts-token', { headers: { 'accept': '*/*', 'x-token': '' } });
            if (stsRes.data.code !== 100000) throw new Error('فشل في الحصول على STS Token');
            const stsData = stsRes.data.data;

            // رفع الصورة إلى OSS
            const fileName = `${uuidv4()}.jpg`;
            const ossPath = `notegpt/web3in1/${fileName}`;
            const ossClient = new OSS({
                region: 'oss-us-west-1',
                accessKeyId: stsData.AccessKeyId,
                accessKeySecret: stsData.AccessKeySecret,
                stsToken: stsData.SecurityToken,
                bucket: 'nc-cdn'
            });
            const imageResponse = await axios.get(attachment.url, { responseType: 'stream' });
            await ossClient.putStream(ossPath, imageResponse.data);
            const uploadedImageUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

            // بدء تعديل الصورة
            const startRes = await client.post('https://notegpt.io/api/v2/images/handle', {
                image_url: uploadedImageUrl,
                type: 60,
                user_prompt: prompt,
                aspect_ratio: "match_input_image",
                num: 4,
                model: "google/nano-banana",
                sub_type: 3
            }, { headers: { 'accept': 'application/json, text/plain, */*' } });
            if (startRes.data.code !== 100000) throw new Error('فشل في بدء تحرير الصورة');
            const sessionId = startRes.data.data.session_id;

            // متابعة حالة التعديل
            let results = [];
            let attempts = 0;
            while (attempts < 30) {
                const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`, { headers: { 'accept': 'application/json, text/plain, */*' } });
                if (statusRes.data.code === 100000) {
                    const status = statusRes.data.data.status;
                    if (status === 'succeeded') {
                        results = statusRes.data.data.results;
                        break;
                    } else if (status === 'failed') throw new Error('فشل في تحرير الصورة');
                }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 4000));
            }
            if (results.length === 0) throw new Error('انتهت مهلة الانتظار');

            // تحميل الصور المعدلة
            const editedImages = [];
            const filesToDelete = [];
            const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            for (let i = 0; i < results.length; i++) {
                const filePath = `${cacheDir}/edited_${uniqueId}_${i + 1}.png`;
                const res = await axios.get(results[i].url, { responseType: 'stream' });
                const writer = fs.createWriteStream(filePath);
                res.data.pipe(writer);
                await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
                editedImages.push(fs.createReadStream(filePath));
                filesToDelete.push(filePath);
            }

            await api.editMessage({ body: '•-• ✨ تم تعديل الصورة', attachment: editedImages }, processingID);

            // مسح الملفات المؤقتة
            setTimeout(() => filesToDelete.forEach(f => fs.existsSync(f) && fs.unlinkSync(f)), 3000);

        } catch (error) {
            await api.editMessage(`•-• ❌ حدث خطأ أثناء تعديل الصورة: ${error.message}`, processingID);
        }
    }
};
