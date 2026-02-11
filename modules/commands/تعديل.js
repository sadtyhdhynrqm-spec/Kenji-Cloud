const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
    config: {
        name: 'تعديل',
        version: '1.0',
        author: 'محمد',
        countDown: 3,
        prefix: true,
        groupAdminOnly: false,
        description: 'تعديل الصور باستخدام AI',
        category: 'ai',
        guide: {
            ar: '{pn} <وصف التعديل> والرد على صورة'
        }
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        if (!event.messageReply || !event.messageReply.attachments?.length) {
            return api.sendMessage('•-• الرجاء الرد على صورة', threadID, messageID);
        }

        const attachment = event.messageReply.attachments[0];
        if (attachment.type !== 'photo') {
            return api.sendMessage('•-• هذا ليس صورة', threadID, messageID);
        }

        const prompt = args.join(' ').trim();
        if (!prompt) return api.sendMessage('•-• الرجاء إضافة وصف للتعديل', threadID, messageID);

        try {
            const infoMsg = await api.sendMessage('•-• 🎨 جاري تعديل الصورة...', threadID, messageID);
            const processingID = infoMsg.messageID;

            // إنشاء مجلد مؤقت
            const cacheDir = path.resolve(__dirname, 'cache');
            await fs.ensureDir(cacheDir);

            // تحميل الصورة مؤقتاً
            const tempFile = path.resolve(cacheDir, `input_${uuidv4()}.jpg`);
            const imageRes = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            await fs.writeFile(tempFile, imageRes.data);

            // إعداد العميل
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
            const ossPath = `notegpt/web3in1/${uuidv4()}.jpg`;
            const ossClient = new OSS({
                region: 'oss-us-west-1',
                accessKeyId: stsData.AccessKeyId,
                accessKeySecret: stsData.AccessKeySecret,
                stsToken: stsData.SecurityToken,
                bucket: 'nc-cdn'
            });
            await ossClient.put(ossPath, tempFile);
            const uploadedImageUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

            // بدء تعديل الصورة
            const startRes = await client.post('https://notegpt.io/api/v2/images/handle', {
                image_url: uploadedImageUrl,
                type: 60,
                user_prompt: prompt,
                aspect_ratio: "match_input_image",
                num: 1,
                model: "google/nano-banana",
                sub_type: 3
            }, { headers: { 'accept': 'application/json, text/plain, */*' } });

            if (startRes.data.code !== 100000) throw new Error('فشل في بدء تحرير الصورة');
            const sessionId = startRes.data.data.session_id;

            // متابعة حالة التعديل
            let resultUrl = null;
            for (let i = 0; i < 20; i++) {
                const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`, { headers: { 'accept': 'application/json, text/plain, */*' } });
                const statusData = statusRes.data;
                if (statusData.code === 100000) {
                    if (statusData.data.status === 'succeeded') {
                        resultUrl = statusData.data.results[0].url;
                        break;
                    } else if (statusData.data.status === 'failed') throw new Error('فشل في تحرير الصورة');
                }
                await new Promise(r => setTimeout(r, 3000));
            }

            if (!resultUrl) throw new Error('انتهت مهلة الانتظار');

            // تحميل الصورة المعدلة وإرسالها
            const editedFile = path.resolve(cacheDir, `edited_${uuidv4()}.png`);
            const editedRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(editedFile, editedRes.data);

            await api.editMessage({ body: '•-• ✨ تم تعديل الصورة', attachment: fs.createReadStream(editedFile) }, processingID);

            // تنظيف الملفات المؤقتة
            await fs.remove(tempFile);
            await fs.remove(editedFile);

        } catch (err) {
            api.sendMessage(`•-• ❌ حدث خطأ أثناء تعديل الصورة: ${err.message}`, threadID, messageID);
        }
    }
};
