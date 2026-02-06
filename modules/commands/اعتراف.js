const fs = require('fs');
const path = require('path');
const axios = require('axios');

const confessAssetsPath = path.join(__dirname, '..', '..', 'assets', 'confess.json');

const defaultMessages = [
    "لدي إعجاب سري بك.",
    "لا أستطيع التوقف عن التفكير فيك.",
    "أنت تؤثر في حياتي بشكل كبير.",
    "أعجب بك من بعيد.",
    "ابتسامتك تضيء يومي.",
    "أتمنى لو كان لدي الجرأة لأتحدث إليك.",
    "تلهمني كل يوم.",
    "أخفي مشاعري منذ فترة.",
    "أشعر بالسعادة فقط لرؤية اسمك.",
    "هناك شيء فيك لا أستطيع شرحه.",
    "أنت تكمل عالمي.",
    "عندما أشعر بالحزن أفكر فيك.",
    "لديك أجمل عيون رأيتها.",
    "طاقتك تملأ المكان.",
    "أحلم بأن أكون معك يوماً ما.",
    "غيرت نظرتي للحياة.",
    "أشعر بأنني محظوظ لوجودك.",
    "أنت سبب ابتسامتي العشوائية.",
    "رؤيتك تجعل يومي أفضل.",
    "يمكنني مشاهدتك طوال اليوم دون ملل.",
    "صوتك هو المفضل لدي.",
    "أعجب بك أكثر كل يوم.",
    "أنت أكثر من يهمك من يدرك.",
    "لم أؤمن بالحب من النظرة الأولى حتى رأيتك.",
    "حتى أصغر اللحظات معك سحرية.",
    "لو كنت تعرف كم تعني لي.",
    "دائماً تعرف كيف تجعلني أبتسم.",
    "أجد السلام فقط بوجودك.",
    "قلبي يخفق عندما أراك.",
    "أنت القطعة المفقودة في حياتي.",
    "كل شيء عنك يجعلني سعيداً.",
    "أنت مشتت انتباهي المفضل.",
    "لا أحد آخر أفضل منك.",
    "ضحكتك أفضل صوت في العالم.",
    "أتمنى لو أستطيع تجميد الوقت معك.",
    "أشعر بالكمال بقربك.",
    "ليس لديك فكرة كم أهتم بك.",
    "كل مرة أنظر إليك، أعشقك من جديد.",
    "أول شخص أفكر فيه صباحاً.",
    "أريد فقط أن أجعلك سعيداً دائماً.",
    "حتى عيوبك تجعل منك شخصاً مثالياً.",
    "وجودك يشعرني وكأنني في بيتي.",
    "أتمنى سرّاً أن تشعر بنفس الشيء تجاهي.",
    "دائماً تجعل الحياة أخف.",
    "العالم يبدو أبهى بوجودك.",
    "أنت الشخص الذي يكتب الناس عنه الأغاني.",
    "ابتسامة واحدة منك تغير مزاجي كله.",
    "تحول الأيام العادية لمغامرة معك.",
    "لم أشعر بمثل هذا من قبل.",
    "إشعارك المفضل لدي.",
    "أنت مذهل بسهولة في كل شيء."
];

function readAssets() {
    try {
        const data = fs.readFileSync(confessAssetsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('حدث خطأ عند قراءة الصور:', error);
        return { image_urls: [] };
    }
}

module.exports = {
    config: {
        name: 'اعتراف',
        version: '1.3',
        author: 'Hridoy | عربي',
        countDown: 30,
        prefix: true,
        groupAdminOnly: false,
        description: 'يرسل اعتراف مجهول لمستخدم محدد.',
        category: 'أدوات',
        guide: {
            ar: '{pn} [@المستخدم|id] [الرسالة]'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions } = event;
        let targetID;
        let message;

        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            const mentionText = mentions[targetID];
            message = args.join(' ').replace(mentionText, '').trim();
        } else {
            targetID = args.shift();
            message = args.join(' ');
        }

        if (!targetID) {
            return api.sendMessage('⚠️ الرجاء تحديد المستخدم لإرسال الاعتراف له.', event.threadID);
        }

        if (targetID == senderID) {
            return api.sendMessage("❌ لا يمكنك إرسال اعتراف لنفسك!", event.threadID);
        }

        const assets = readAssets();
        if (!assets.image_urls || assets.image_urls.length === 0) {
            return api.sendMessage('⚠️ لا توجد صور للاعتراف.', event.threadID);
        }

        const validImageUrls = assets.image_urls.filter(url => url && typeof url === 'string');
        if (validImageUrls.length === 0) {
            return api.sendMessage('⚠️ لا توجد صور صالحة.', event.threadID);
        }

        const randomImage = validImageUrls[Math.floor(Math.random() * validImageUrls.length)];
        const confessionMessage = message || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];

        let imagePath = null;
        try {
            console.log(`[API Request] جلب الصورة من: ${randomImage}`);
            const imageResponse = await axios.get(randomImage, { responseType: 'arraybuffer' });
            console.log(`[API Response] Status: ${imageResponse.status}, Status Text: ${imageResponse.statusText}`);

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            imagePath = path.join(cacheDir, `confess_${Date.now()}${path.extname(randomImage)}`);
            fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, 'binary'));

            const senderInfo = await api.getUserInfo(senderID);
            const senderName = senderInfo[senderID]?.name || 'مجهول';

            const finalMessage = {
                body: `📢 لديك اعتراف:\n\n"${confessionMessage}"\n\n💌 من: ${senderName}`,
                attachment: fs.createReadStream(imagePath)
            };

            api.sendMessage(finalMessage, targetID, (err) => {
                if (imagePath) fs.unlinkSync(imagePath);
                if (err) {
                    console.error("فشل إرسال الاعتراف:", err);
                    api.sendMessage("❌ لم يتم إرسال الاعتراف. ربما المستخدم حظر البوت.", event.threadID);
                } else {
                    api.sendMessage("✅ تم إرسال اعترافك بنجاح!", event.threadID);
                }
            });

        } catch (error) {
            console.error(`[API Error] فشل جلب الصورة ${randomImage}:`, error.message);
            if (imagePath) fs.unlinkSync(imagePath);

            api.sendMessage("⚠️ حدث خطأ أثناء إرسال الاعتراف. سيتم إرسال الرسالة نصياً فقط.", event.threadID);

            const textOnlyMessage = {
                body: `📢 لديك اعتراف:\n\n"${confessionMessage}"\n\n💌 من: ${senderName || 'مجهول'}`
            };
            api.sendMessage(textOnlyMessage, targetID, (err) => {
                if (err) {
                    console.error("فشل إرسال الاعتراف النصي:", err);
                    api.sendMessage("❌ لم يتم إرسال الاعتراف. ربما المستخدم حظر البوت.", event.threadID);
                } else {
                    api.sendMessage("✅ تم إرسال اعترافك نصياً بنجاح!", event.threadID);
                }
            });
        }
    },
};
