const fs = require('fs');
const path = require('path');

const userDBPath = path.join(__dirname, '..', '..', 'database', 'users.json');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function writeDB(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

module.exports = {
    config: {
        name: 'عمل',
        version: '1.0',
        author: 'Kenji Agent',
        countDown: 600, // 10 minutes
        prefix: true,
        category: 'اللعب',
        description: 'القيام ببعض العمل لكسب المال.',
        guide: { ar: '{pn}' }
    },
    onStart: async ({ api, event, Users }) => {
        const { senderID, threadID } = event;
        const userDB = readDB(userDBPath);

        if (!userDB[senderID]) {
            userDB[senderID] = { name: (await api.getUserInfo(senderID))[senderID].name, balance: 0 };
        }

        const jobs = [
            ' لقد عملت كرقاصه لملك وقد اعجب رقيصك الملك فقنج بيك ', 'توصيل طلبات', 'بيع خضار', 'تصميم جرافيك', 'صيانة جوالات', 
            'تدريس خصوصي', 'حراسة أمنية', 'غسيل سيارات', 'صيد سمك', 'جمع خردة'
        ];
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const amount = Math.floor(Math.random() * (500 - 100 + 1)) + 100;

        userDB[senderID].balance += amount;
        writeDB(userDBPath, userDB);

        const msg = `💼 لقد عملت في [ ${job} ]\n💰 وكسبت: ${amount.toLocaleString()} رصيد\n━━━━━━━━━━━━━\nرصيدك الحالي: ${userDB[senderID].balance.toLocaleString()}`;
        return api.sendMessage(msg, threadID);
    }
};
