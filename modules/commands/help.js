const fs = require('fs');
const path = require('path');
const axios = require('axios');
const fsExtra = require('fs-extra');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');
const commandsPath = path.join(__dirname, '..', 'commands');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`خطأ في قراءة الملف ${filePath}:`, error);
        return {};
    }
}

async function downloadImage(url) {
    const tempPath = path.join(__dirname, 'temp_image.jpg');
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    fsExtra.writeFileSync(tempPath, response.data);
    return tempPath;
}

module.exports = {
    config: {
        name: 'اوامر',
        version: '5.0',
        author: 'Edited by Abu Obaida',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'عرض قائمة الأوامر أو تفاصيل أمر محدد.',
        category: 'المجموعة',
        guide: {
            ar: '{pn}\n{pn} <اسم_الأمر>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const input = args[0];

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        const commands = {};

        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(path.join(commandsPath, file))];
                const command = require(path.join(commandsPath, file));

                if (command.config) {
                    commands[command.config.name.toLowerCase()] = command.config;

                    if (command.config.aliases) {
                        for (const alias of command.config.aliases) {
                            commands[alias.toLowerCase()] = command.config;
                        }
                    }
                }
            } catch (error) {
                console.error(`خطأ أثناء تحميل ${file}:`, error);
            }
        }

        const uniqueCommands = Object.values(commands)
            .filter((cmd, index, self) =>
                self.findIndex(c => c.name === cmd.name) === index
            );

        // =========================
        // عرض تفاصيل أمر
        // =========================
        if (input) {
            const commandConfig = commands[input.toLowerCase()];

            if (!commandConfig) {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }

            let detailMessage =
`━━━━━━━━━━•✧•━━━━━━━━━━━
📌 معلومات الأمر

الاسم: ${commandConfig.name}
الوصف: ${commandConfig.description}
المؤلف: ${commandConfig.author}
الإصدار: ${commandConfig.version}`;

            if (commandConfig.aliases?.length) {
                detailMessage += `\nالأسماء المستعارة: ${commandConfig.aliases.join(' ⌁ ')}`;
            }

            if (commandConfig.guide?.ar) {
                detailMessage += `\n\nطريقة الاستخدام:\n${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}`;
            }

            detailMessage += `\n━━━━━━━━━━•✧•━━━━━━━━━━━`;

            return api.sendMessage(detailMessage, event.threadID);
        }

        // =========================
        // تصنيف الأوامر
        // =========================
        const categories = {};

        const categoryMap = {
            'group': 'المجموعة',
            'image': 'الصور',
            'media': 'الوسائط',
            'admin': 'الإدارة',
            'fun': 'الترفيه',
            'random': 'عشوائي',
            'music': 'الموسيقى',
            'video': 'الفيديو',
            'ai': 'الذكاء AI الأقوى',
            'tools': 'الأدوات',
            'utility': 'الخدمات السريعة',
            'owner': 'المطور',
            'level': 'المستوى',
            'game': 'اللعب',
            'play': 'اللعب',
        };

        for (const cmd of uniqueCommands) {
            let category = cmd.category || 'الترفيه';

            // ✅ تصحيح الفئة إذا كانت من فئات الألعاب
            if (['اقتصاد', 'اللعب', 'game', 'play'].includes(category)) {
                category = 'اللعب';
            }

            // ✅ لو الأمر تبع مطور
            if (
                category === 'owner' ||
                category === 'المطور' ||
                cmd.role === 2 ||
                ['رستارت', 'إشعار'].includes(cmd.name)
            ) {
                category = 'المطور';
            }

            category = categoryMap[category] || category;

            if (!categories[category]) categories[category] = [];
            categories[category].push(cmd.name);
        }

        const orderedCats = [
            'المجموعة',
            'الصور',
            'الوسائط',
            'الذكاء AI الأقوى',
            'الترفيه',
            'اللعب',
            'عشوائي',
            'المطور',
            'الأدوات'
        ];

        // =========================
        // بناء القائمة
        // =========================
        let finalMessage = "";
        const line = "━━━━━━━━━━━━━";

        for (const category of orderedCats) {
            const cmds = categories[category];
            if (!cmds || cmds.length === 0) continue;

            // إخفاء قسم المطور لغير الأدمن
            const adminList = config.adminUIDs || [];
            if (category === "المطور" && !adminList.includes(event.senderID)) {
                continue;
            }

            finalMessage += `${line}\n`;
            finalMessage += `『 ${category} 』\n\n`;

            for (let i = 0; i < cmds.length; i += 3) {
                const row = cmds
                    .slice(i, i + 3)
                    .map(c => `⤹⌯ ${c}`)
                    .join("   ");
                finalMessage += `${row}\n`;
            }

            finalMessage += "\n";
        }

        finalMessage += `${line}\n`;
        finalMessage += `•✧• عدد الأوامر: ${uniqueCommands.length}\n`;
        finalMessage += `${line}`;

        const imageURL = 'https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg';

        return api.sendMessage(
            {
                body: finalMessage.trim(),
                attachment: fs.createReadStream(await downloadImage(imageURL))
            },
            event.threadID
        );
    }
};
