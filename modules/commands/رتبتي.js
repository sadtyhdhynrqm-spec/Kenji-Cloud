const fs = require('fs');
const path = require('path');
const axios = require('axios');

const userDBPath = path.join(__dirname, '..', '..', 'database', 'users.json');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error(`خطأ عند قراءة قاعدة البيانات في ${filePath}:`, error);
        return {};
    }
}

function calculateRequiredXP(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

module.exports = {
    config: {
        name: 'رتبتي', // اسم الأمر بالعربي
        version: '1.1',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'عرض بطاقة رتبتك أو رتبة مستخدم آخر، أو عرض أفضل 10 مستخدمين.',
        category: 'level',
        guide: {
            en: '{pn}\n{pn} [@mention|uid]\n{pn} top'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, mentions } = event;
        const userDB = readDB(userDBPath);
        const sortedUsers = Object.values(userDB).sort((a, b) => b.rank - a.rank);

        // عرض أفضل 10 مستخدمين
        if (args[0] === 'top') {
            const topUsers = sortedUsers.slice(0, 10);
            let message = '🏆 أفضل 10 مستخدمين حسب المستوى:\n';
            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                message += `${i + 1}. ${user.name}: المستوى ${user.rank}\n`;
            }

            const userRank = sortedUsers.findIndex(user => user.userID === senderID) + 1;
            if (userRank > 0) {
                message += `\nرتبتك: ${userRank}`;
            }

            return api.sendMessage(message, event.threadID);
        }

        // تحديد المستخدم المستهدف
        let targetID;
        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (args.length > 0) {
            targetID = args[0];
        } else {
            targetID = senderID;
        }

        if (!userDB[targetID]) {
            return api.sendMessage("❌ هذا المستخدم ليس لديه حساب بعد.", event.threadID);
        }

        const userData = userDB[targetID];
        const level = userData.rank || 1; 
        const currentXP = userData.xp || 0; 
        const requiredXP = calculateRequiredXP(level);
        const name = userData.name || 'مستخدم مجهول'; 
        const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

        const rankIndex = sortedUsers.findIndex(user => user.userID === targetID);
        const rank = rankIndex >= 0 ? rankIndex + 1 : 9999;

        const style = Math.floor(Math.random() * 5) + 1;
        const apiUrl = `https://hridoy-apis.vercel.app/canvas/rank-card-v2?avatarImgURL=${encodeURIComponent(avatarUrl)}&nickname=${encodeURIComponent(name)}&currentLvl=${level}&currentRank=${rank}&currentXP=${currentXP}&requiredXP=${requiredXP}&userStatus=online&style=${style}&apikey=hridoyXQC`;

        try {
            console.log(`[API Request] إرسال إلى: ${apiUrl}`);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            console.log(`[API Response] الحالة: ${response.status}, Status Text: ${response.statusText}`);

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `rank_card_${targetID}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));

        } catch (error) {
            console.error("خطأ عند إنشاء أو إرسال بطاقة الرتبة:", error);
            api.sendMessage("❌ عذرًا، لم أتمكن من إنشاء بطاقة الرتبة الآن.", event.threadID);
        }
    },
};
