const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');
const commandsPath = path.join(__dirname, '..', 'commands');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`حدث خطأ أثناء قراءة الملف ${filePath}:`, error);
        return {};
    }
}

module.exports = {
    config: {
        name: 'اوامر',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يعرض لك قائمة الأوامر أو تفاصيل أمر محدد مع صورة.',
        category: 'أدوات',
        guide: {
            ar: '   {pn}\n   {pn} <اسم_الأمر>'
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
                console.error(`خطأ أثناء تحميل الأمر من الملف ${file}:`, error);
            }
        }

        // =================================
        // قائمة الأوامر الكاملة
        // =================================
        if (!commandName) {
            const categories = {};
            for (const cmd in commands) {
                const c = commands[cmd];
                if (!categories[c.category]) categories[c.category] = new Map();
                if (!categories[c.category].has(c.name)) categories[c.category].set(c.name, c);
            }

            let totalCommands = 0;
            for (const cat of Object.values(categories)) totalCommands += cat.size;

            let helpMessage = '';
            helpMessage += `•◌───˚❀˚─◌─˚❀˚───◌•◌───˚❀˚\n\n`;
            helpMessage += `⌈ ${config.botName || 'بوتك'} ⌋\n`;
            helpMessage += `💻 عدد الأوامر: ${totalCommands}\n\n`;

            for (const [category, cmdsMap] of Object.entries(categories)) {
                const cmds = Array.from(cmdsMap.values());
                helpMessage += `•◌────˚❀˚───◌ ────˚❀˚────\n\n`;
                helpMessage += `⌈  ${category.toUpperCase()} ⌋\n`;
                let line = '';
                cmds.forEach(command => {
                    line += `⋄ ${command.name} `;
                });
                helpMessage += line.trim() + '\n\n';
            }

            helpMessage += `•◌────˚❀˚───◌ ────˚❀˚────\n`;
            helpMessage += `⇒ ℹ️ استخدم: ${config.prefix}مساعدة <اسم_الأمر> لعرض التفاصيل`;

            // ارسال مع الصورة اللي انت وريتنا
            const imageUrl = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';
            return api.sendMessage(
                { body: helpMessage, attachment: await global.getStreamFromURL(imageUrl) },
                event.threadID
            );

        } else {
            // =================================
            // تفاصيل أمر محدد
            // =================================
            const commandConfig = commands[commandName.toLowerCase()];
            if (commandConfig) {
                let detailMessage = '';
                detailMessage += `╔═✪🔹 معلومات الأمر 🔹✪═╗\n\n`;
                detailMessage += `💠 الاسم: ${commandConfig.name}\n`;
                detailMessage += `💠 الوصف: ${commandConfig.description}\n`;
                detailMessage += `💠 المؤلف: ${commandConfig.author}\n`;
                detailMessage += `💠 الإصدار: ${commandConfig.version}\n`;
                if (commandConfig.aliases && commandConfig.aliases.length > 0) {
                    detailMessage += `💠 الأسماء المستعارة: ${commandConfig.aliases.join(', ')}\n`;
                }
                if (commandConfig.guide && commandConfig.guide.ar) {
                    detailMessage += `💠 الاستخدام:\n${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}\n`;
                }
                detailMessage += `╚═✨ استمتع بالأوامر واستخدمها بحكمة ✨═╝`;

                return api.sendMessage(detailMessage, event.threadID);
            } else {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${commandName}"`, event.threadID);
            }
        }
    },
};
