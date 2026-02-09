const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');
const commandsPath = path.join(__dirname, '..', 'commands');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file at ${filePath}:`, error);
        return {};
    }
}

// الزخارف النهائية
const topLine = '◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯';
const bottomLine = '◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯';

module.exports = {
    config: {
        name: 'اوامر',
        version: '2.4',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يعرض قائمة الأوامر أو تفاصيل عن أمر محدد.',
        category: 'utility',
        guide: {
            ar: '{pn} \n{pn} <اسم_الأمر>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const commandName = args[0];

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        const commands = {};

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.config) {
                    commands[command.config.name] = command.config;
                    if (command.config.aliases) {
                        for (const alias of command.config.aliases) {
                            commands[alias] = command.config;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error loading command from file ${file}:`, error);
            }
        }

        if (!commandName) {
            const botName = config.botName || 'بوت';

            // تصنيف الأوامر
            const categories = {
                'المطور': new Map(),
                'المجمعة': new Map(),
                'الترفيه': new Map(),
                'الذكاء_الاصطناعي': new Map()
            };

            // منع تكرار الأوامر
            const seenCommands = new Set();

            for (const cmdKey in commands) {
                const c = commands[cmdKey];
                if (seenCommands.has(c.name)) continue; // تجاهل التكرار
                seenCommands.add(c.name);

                const cat = c.category ? c.category.toLowerCase() : 'fun';
                if (cat.includes('developer') || cat.includes('admin')) {
                    categories['المطور'].set(c.name, c);
                } else if (cat.includes('group')) {
                    categories['المجمعة'].set(c.name, c);
                } else if (cat.includes('ai') || cat.includes('ذكاء')) {
                    categories['الذكاء_الاصطناعي'].set(c.name, c);
                } else {
                    // أي أوامر غير مصنفة تذهب للتّرفيه
                    categories['الترفيه'].set(c.name, c);
                }
            }

            // حساب العدد الإجمالي للأوامر
            let totalCommands = 0;
            for (const cat of Object.values(categories)) totalCommands += cat.size;

            let helpMessage = '';
            helpMessage += topLine + '\n';
            helpMessage += `💠 قائمة أوامر ${botName}\n\n`;
            helpMessage += `💻 عدد الأوامر: ${totalCommands}\n\n`;

            // عرض الأوامر لكل قسم في صف واحد مع فاصل ◈
            for (const [category, cmdsMap] of Object.entries(categories)) {
                if (cmdsMap.size === 0) continue; // تجاهل الفئات الفارغة
                const cmds = Array.from(cmdsMap.values()).map(c => c.name);
                helpMessage += `🔹 ${category}:\n`;
                helpMessage += cmds.join(' ◈ ') + '\n\n';
            }

            helpMessage += bottomLine + '\n';
            helpMessage += `💬 نصيحة: استخدم !help <اسم_الأمر> للحصول على التفاصيل`;

            // إرسال الصورة مع النص من رابط الإنترنت
            const imageURL = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';
            return api.sendMessage({ body: helpMessage, attachment: imageURL }, event.threadID);

        } else {
            // تفاصيل أمر محدد بدون اسم المطور
            const commandConfig = commands[commandName.toLowerCase()];
            if (commandConfig) {
                let detailMessage = '';
                detailMessage += `💠 معلومات عن الأمر - ${commandConfig.name}\n\n`;
                detailMessage += `📜 الوصف: ${commandConfig.description}\n`;
                detailMessage += `🆚 الإصدار: ${commandConfig.version}\n`;
                if (commandConfig.aliases && commandConfig.aliases.length > 0) {
                    detailMessage += `🔹 الأسماء البديلة: ${commandConfig.aliases.join(', ')}\n`;
                }
                if (commandConfig.guide && commandConfig.guide.ar) {
                    detailMessage += `💡 طريقة الاستخدام: ${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}\n`;
                }
                return api.sendMessage(detailMessage, event.threadID);
            } else {
                return api.sendMessage(`⚠️ الأمر "${commandName}" غير موجود.`, event.threadID);
            }
        }
    },
};
