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

// تحميل الصورة مؤقتاً
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
        version: '3.0',
        author: 'Hridoy + Edited by Abu Obaida',
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

        // تحميل جميع الأوامر
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

        // عرض تفاصيل أمر محدد
        if (input) {
            const commandConfig = commands[input.toLowerCase()];

            if (!commandConfig) {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }

            let detailMessage =
`📌 معلومات الأمر
الاسم: ${commandConfig.name}
الوصف: ${commandConfig.description}
المؤلف: ${commandConfig.author}
الإصدار: ${commandConfig.version}`;

            if (commandConfig.aliases?.length) {
                detailMessage += `\nالأسماء المستعارة: ${commandConfig.aliases.join(' ⌯ ')}`;
            }

            if (commandConfig.guide?.ar) {
                detailMessage += `\nالاستخدام:\n${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}`;
            }

            return api.sendMessage(detailMessage, event.threadID);
        }

        // =========================
        // تقسيم الفئات وجعلها جميلة
        // =========================
        const categories = {};

        const categoryMap = {
            'group': 'المجموعة',
            'Group': 'المجموعة',
            'image': 'الصور',
            'وسائط': 'الصور',
            'media': 'الوسائط',
            'admin': 'الإدارة',
            'fun': 'الترفيه',
            'random': 'عشوائي',
            'music': 'الموسيقى',
            'video': 'الفيديو',
            'ai': 'الذكاء AI الأقوى',
            'tools': 'الآداوات المبتكرة',
            'utility': 'الخـدمات السريعة',
            'owner': 'المطور',
            'level': 'المستوى',
            'game': 'اللعب',
            'play': 'اللعب',
        };

        // دمج وتوحيد الفئات
        for (const cmd of uniqueCommands) {
            let category = cmd.category || "أخرى";
            category = categoryMap[category] || category;

            if (!categories[category]) categories[category] = [];
            categories[category].push(cmd.name);
        }

        // دمج الفئات الصغيرة في "أخرى"
        const finalCategories = {};
        for (const [cat, cmds] of Object.entries(categories)) {
            if (cmds.length < 3 && cat !== "أخرى") {
                if (!finalCategories['أخرى']) finalCategories['أخرى'] = [];
                finalCategories['أخرى'].push(...cmds);
            } else {
                finalCategories[cat] = cmds;
            }
        }

        // ترتيب الفئات
        const orderedCats = [
            'المجموعة', 'الخـدمات السريعة', 'الصور', 'الوسائط', 'الموسيقى', 'الفيديو', 'الذكاء AI الأقوى',
            'الترفيه', 'اللعب', 'عشوائي', 'المستوى', 'المطور', 'الآداوات المبتكرة', 'أخرى'
        ];

        // بناء الرسالة بالنمط الفني
        let finalMessage = "";
        for (const category of orderedCats) {
            const cmds = finalCategories[category];
            if (!cmds || cmds.length === 0) continue;

            // إخفاء فئة المطور لغير المطور
            if (category === "المطور" && !config.adminBot?.includes(event.senderID)) continue;

            finalMessage += `╭───── •✧• ─────\n│       🪙 ${category}\n├\n`;

            // تقسيم الأوامر في صفوف 3 أوامر لكل صف
            for (let i = 0; i < cmds.length; i += 3) {
                const row = cmds.slice(i, i + 3).map(c => `⤹⌯ ${c}`).join('  ');
                finalMessage += `│ ${row}\n`;
            }

            finalMessage += '╰───── •✧• ─────\n';
        }

        finalMessage += `≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡\n『عدد الاوامر: ${uniqueCommands.length}』`;

        // صورة خلفية جميلة
        const imageURL = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';

        return api.sendMessage(
            {
                body: finalMessage.trim(),
                attachment: fs.createReadStream(await downloadImage(imageURL))
            },
            event.threadID
        );
    }
};
