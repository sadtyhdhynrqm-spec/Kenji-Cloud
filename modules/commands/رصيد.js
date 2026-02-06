const fs = require('fs');
const path = require('path');

const userDBPath = path.join(__dirname, '..', '..', 'database', 'users.json');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error(`خطأ في قراءة قاعدة البيانات ${filePath}:`, error);
        return {};
    }
}

module.exports = {
    config: {
        name: 'رصيد',
        version: '1.0',
        author: 'Hridoy',
        aliases: ['bal', 'فلوس'],
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'عرض رصيدك أو رصيد شخص آخر.',
        category: 'اقتصاد',
        guide: {
            ar: '   {pn}\n   {pn} [@منشن | uid]'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions } = event;
        let targetID;

        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (args.length > 0) {
            targetID = args[0];
        } else {
            targetID = senderID;
        }

        const userDB = readDB(userDBPath);

        if (!userDB[targetID]) {
            if (targetID === senderID) {
                return api.sendMessage(
                    '❌ ما عندك حساب في النظام.',
                    event.threadID
                );
            } else {
                return api.sendMessage(
                    '❌ هذا المستخدم ما عنده حساب.',
                    event.threadID
                );
            }
        }

        const balance = userDB[targetID].balance;
        const name = userDB[targetID].name;

        let message;
        if (targetID === senderID) {
            message = `💰 رصيدك الحالي هو: ${balance}`;
        } else {
            message = `💳 رصيد ${name} الحالي هو: ${balance}`;
        }

        return api.sendMessage(message, event.threadID);
    },
};
