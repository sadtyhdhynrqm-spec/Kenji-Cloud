const fs = require('fs');
const path = require('path');

const bankDBPath = path.join(__dirname, '..', '..', 'database', 'bank.json');

function readBankDB() {
    try {
        const data = fs.readFileSync(bankDBPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        console.error('❌ خطأ في قراءة قاعدة بيانات البنك:', error);
        return {};
    }
}

function writeBankDB(data) {
    try {
        fs.writeFileSync(bankDBPath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('❌ خطأ في كتابة قاعدة بيانات البنك:', error);
    }
}

module.exports = {
    config: {
        name: 'بنك',
        version: '1.3',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: '🏦 نظام بنكي كامل بالقروض وعرض أغنى المستخدمين',
        category: 'اقتصاد',
        guide: {
            ar: '💠 الأوامر:\n' +
                '✨ {pn} انشاء - لإنشاء حساب بنكي\n' +
                '✨ {pn} - لعرض رصيدك\n' +
                '✨ {pn} قرض <المبلغ> - للحصول على قرض\n' +
                '✨ {pn} تسديد - لتسديد القرض\n' +
                '✨ {pn} الأعلى - عرض أغنى 10 مستخدمين'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID } = event;
        const bankDB = readBankDB();
        const subcommand = args[0] ? args[0].toLowerCase() : null;

        // ✨ الحالة الافتراضية: عرض الحساب
        if (!subcommand) {
            if (bankDB[senderID]) {
                const userData = bankDB[senderID];
                const statusMessage = `🏦 ══ 🌟 حسابك البنكي 🌟 ══ 🏦\n\n` +
                                      `💰 الرصيد: ${userData.bankBalance}\n` +
                                      `📄 قرض: ${userData.loan ? '✅ نعم' : '❌ لا'}\n` +
                                      `💵 مبلغ القرض: ${userData.loanAmount}\n\n` +
                                      `⚡ استخدم \`بنك الأعلى\` لمعرفة أغنى المستخدمين!`;
                return api.sendMessage(statusMessage, event.threadID);
            } else {
                return api.sendMessage('❌ ليس لديك حساب بنك بعد. استخدم `بنك انشاء` لإنشاء الحساب.', event.threadID);
            }
        }

        // ✨ إنشاء حساب بنك
        if (subcommand === 'انشاء') {
            if (bankDB[senderID]) {
                return api.sendMessage('⚠️ لديك حساب بنك بالفعل!', event.threadID);
            }
            bankDB[senderID] = {
                userID: senderID,
                loan: false,
                loanAmount: 0,
                bankBalance: 0
            };
            writeBankDB(bankDB);
            return api.sendMessage('🎉 تم إنشاء حسابك البنكي بنجاح! 💰', event.threadID);
        }

        // ✨ التأكد من وجود حساب قبل باقي الأوامر
        if (!bankDB[senderID]) {
            return api.sendMessage('❌ ليس لديك حساب بنك بعد. استخدم `بنك انشاء` أولاً.', event.threadID);
        }

        // ✨ أخذ قرض
        if (subcommand === 'قرض') {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                return api.sendMessage('⚠️ الرجاء إدخال مبلغ صالح للقرض.', event.threadID);
            }
            if (amount > 10000) {
                return api.sendMessage('❌ الحد الأقصى للقرض هو 10,000 💸', event.threadID);
            }
            if (bankDB[senderID].loan) {
                return api.sendMessage('⚠️ لديك قرض قائم بالفعل!', event.threadID);
            }

            bankDB[senderID].loan = true;
            bankDB[senderID].loanAmount = amount;
            bankDB[senderID].bankBalance += amount;
            writeBankDB(bankDB);

            return api.sendMessage(`💵 تم منحك قرضاً بقيمة ${amount}!\n💰 رصيدك الحالي: ${bankDB[senderID].bankBalance}`, event.threadID);

        // ✨ تسديد القرض
        } else if (subcommand === 'تسديد') {
            if (!bankDB[senderID].loan) {
                return api.sendMessage('❌ ليس لديك قرض لتسديده.', event.threadID);
            }

            const loanAmount = bankDB[senderID].loanAmount;
            if (bankDB[senderID].bankBalance < loanAmount) {
                return api.sendMessage(`⚠️ رصيدك غير كافٍ لتسديد القرض 💸\nتحتاج على الأقل: ${loanAmount}`, event.threadID);
            }

            bankDB[senderID].bankBalance -= loanAmount;
            bankDB[senderID].loan = false;
            bankDB[senderID].loanAmount = 0;
            writeBankDB(bankDB);

            return api.sendMessage(`✅ تم تسديد قرضك بنجاح! 💰\nرصيدك الجديد: ${bankDB[senderID].bankBalance}`, event.threadID);

        // ✨ عرض أغنى 10 مستخدمين
        } else if (subcommand === 'الأعلى') {
            const sortedUsers = Object.values(bankDB).sort((a, b) => b.bankBalance - a.bankBalance);
            const topUsers = sortedUsers.slice(0, 10);

            let message = '🏆 ══ 🌟 أغنى 10 مستخدمين 🌟 ══ 🏆\n\n';
            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                try {
                    const userInfo = await api.getUserInfo(user.userID);
                    const name = userInfo[user.userID].name;
                    message += `💠 ${i + 1}. ${name} - 💰 ${user.bankBalance}\n`;
                } catch (e) {
                    message += `💠 ${i + 1}. مستخدم ${user.userID} - 💰 ${user.bankBalance}\n`;
                }
            }

            return api.sendMessage(message, event.threadID);

        } else {
            return api.sendMessage('❌ أمر غير صالح! استخدم: `بنك انشاء`, `بنك قرض`, `بنك تسديد`, أو `بنك الأعلى`.', event.threadID);
        }
    },
};
