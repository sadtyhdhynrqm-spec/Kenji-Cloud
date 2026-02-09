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

// الزخارف النهائية (فخمة، طول ثابت ومتناسق)
const topLine = '◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯';
const bottomLine = '◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯';

module.exports = {
    config: {
        name: 'اوامر',
        version: '2.1',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يعرض قائمة الأوامر أو تفاصيل عن أمر محدد.',
        category: 'utility',
        guide: {
            ar: '   {pn}' +
                '\n   {pn} <اسم_الأمر>'
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

            const categories = {};
            for (const cmd in commands) {
                const c = commands[cmd];
                if (!categories[c.category]) categories[c.category] = new Map();
                if (!categories[c.category].has(c.name)) categories[c.category].set(c.name, c);
            }

            let totalCommands = 0;
            for (const cat of Object.values(categories)) totalCommands += cat.size;

            let helpMessage = '';
            helpMessage += topLine + '\n';
            helpMessage += `💠 قائمة أوامر ${botName}\n\n`;
            helpMessage += `💻 عدد الأوامر: ${totalCommands}\n\n`;

            for (const [category, cmdsMap] of Object.entries(categories)) {
                const cmds = Array.from(cmdsMap.values()).map(c => c.name);
                helpMessage += `🔹 ${category.toUpperCase()}:\n`;
                helpMessage += cmds.join(' ◈ ') + '\n\n';
            }

            helpMessage += bottomLine + '\n';
            helpMessage += `💬 نصيحة: استخدم !help <اسم_الأمر> للحصول على التفاصيل\n`;

            // إرسال صورة مع النص إذا كانت موجودة
            const imagePath = path.join(__dirname, '..', '..', 'media', 'https://i.ibb.co/rKsDY73q/1768624739835.jpg');
            if (fs.existsSync(imagePath)) {
                return api.sendMessage({ body: helpMessage, attachment: fs.createReadStream(imagePath) }, event.threadID);
            } else {
                return api.sendMessage(helpMessage, event.threadID);
            }

        } else {
            const commandConfig = commands[commandName.toLowerCase()];
            if (commandConfig) {
                let detailMessage = '';
                detailMessage += `💠 معلومات عن الأمر - ${commandConfig.name}\n\n`;
                detailMessage += `📜 الوصف: ${commandConfig.description}\n`;
                detailMessage += `👑 المطور: ${commandConfig.author}\n`;
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
