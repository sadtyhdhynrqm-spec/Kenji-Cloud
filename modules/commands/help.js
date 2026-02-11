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

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        const commands = {};

        // تحميل كل الأوامر
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

        // =================================
        // عرض تفاصيل أمر محدد
        // =================================
        if (input) {
            const commandConfig = commands[input.toLowerCase()];

            if (!commandConfig) {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }

            let detailMessage =
`╭═══════════════════╮
│ 📌 معلومات الأمر
├═══════════════════
│ الاسم: ${commandConfig.name}
│ الوصف: ${commandConfig.description}
│ المؤلف: ${commandConfig.author}
│ الإصدار: ${commandConfig.version}`;

            if (commandConfig.aliases?.length) {
                detailMessage += `\n│ الأسماء المستعارة: ${commandConfig.aliases.join(' ⌯ ')}`;
            }

            if (commandConfig.guide?.ar) {
                detailMessage += `\n│ الاستخدام:\n│ ${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}`;
            }

            detailMessage += `\n╰═══════════════════╯`;

            return api.sendMessage(detailMessage, event.threadID);
        }

        // =================================
        // تقسيم الفئات
        // =================================
        const categorized = {
            "زكاء صناعي": [],
            "المطور": [],
            "الترفيه": [],
            "المجموعة": [],
            "أخرى": []
        };

        for (const cmd of uniqueCommands) {
            const category = cmd.category || "أخرى";

            if (categorized[category]) {
                categorized[category].push(cmd.name);
            } else {
                categorized["أخرى"].push(cmd.name);
            }
        }

        let finalMessage = "";

        for (const category in categorized) {

            // إخفاء فئة المطور لغير المطور
            if (category === "المطور" && !config.adminBot?.includes(event.senderID)) {
                continue;
            }

            if (categorized[category].length === 0) continue;

            finalMessage +=
`╭═══════════════════╮
│ 📂 ${category}
├═══════════════════
│ ${categorized[category].join(' ⌯ ')}
╰═══════════════════╯

`;
        }

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
