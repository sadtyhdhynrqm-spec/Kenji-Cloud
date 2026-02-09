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
        console.error(`حدث خطأ أثناء قراءة الملف ${filePath}:`, error);
        return {};
    }
}

async function downloadImage(url) {
    const pathTemp = path.join(__dirname, 'temp_image.jpg');
    const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
    fsExtra.writeFileSync(pathTemp, response.data);
    return pathTemp;
}

const SECTION_DECOR = '◯⊰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰⊱◯';

module.exports = {
    config: {
        name: 'اوامر',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يعرض لك قائمة الأوامر أو تفاصيل أمر محدد.',
        category: 'أدوات',
        guide: {
            ar: '   {pn}\n   {pn} <اسم_الأمر>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const input = args[0];

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        const commands = {};

        for (const file of commandFiles) {
            try {
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
                console.error(`خطأ أثناء تحميل الأمر من الملف ${file}:`, error);
            }
        }

        // ==============================
        // عرض تفاصيل أمر محدد عند طلبه
        // ==============================
        if (input) {
            const commandConfig = commands[input.toLowerCase()];
            if (commandConfig) {
                let detailMessage = `${SECTION_DECOR}\n`;
                detailMessage += `🌟 معلومات الأمر:\n\n`;
                detailMessage += `🌟 الاسم: ${commandConfig.name}\n`;
                detailMessage += `🌟 الوصف: ${commandConfig.description}\n`;
                detailMessage += `🌟 المؤلف: ${commandConfig.author}\n`;
                detailMessage += `🌟 الإصدار: ${commandConfig.version}\n`;
                if (commandConfig.aliases && commandConfig.aliases.length > 0) {
                    detailMessage += `🌟 الأسماء المستعارة: ${commandConfig.aliases.join(', ')}\n`;
                }
                if (commandConfig.guide && commandConfig.guide.ar) {
                    detailMessage += `🌟 الاستخدام:\n${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}\n`;
                }
                detailMessage += `${SECTION_DECOR}`;

                return api.sendMessage(detailMessage, event.threadID);
            } else {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }
        }

        // ==============================
        // تقسيم الأوامر حسب الأقسام
        // ==============================
        const sections = {
            'المطور': [],
            'المجموعه': [],
            'ترفيه': [],
            'ذكاء صناعي': [],
        };

        for (const cmd of Object.values(commands)) {
            const category = (cmd.category || 'ترفيه').toLowerCase();

            if (category === 'المطور') sections['المطور'].push(cmd.name);
            else if (category === 'المجموعه') sections['المجموعه'].push(cmd.name);
            else if (category === 'ترفيه') sections['ترفيه'].push(cmd.name);
            else if (category === 'ذكاء صناعي' || category === 'ai') sections['ذكاء صناعي'].push(cmd.name);
            else sections['ترفيه'].push(cmd.name); // أي أمر غير معروف يوضع في الترفيه
        }

        // ==============================
        // بناء الرسالة المزخرفة الموحدة
        // ==============================
        let finalMessage = `${SECTION_DECOR}\n`;
        for (const [section, cmds] of Object.entries(sections)) {
            if (cmds.length === 0) continue;
            finalMessage += `🔹 ${section} 🔹\n`;
            finalMessage += cmds.map(name => `➤ ${name}`).join(' ◇ ') + '\n\n';
        }
        finalMessage += `${SECTION_DECOR}`;

        // ==============================
        // إرسال الرسالة مع صورة
        // ==============================
        const imageURL = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';
        return api.sendMessage(
            {
                body: finalMessage,
                attachment: fs.createReadStream(await downloadImage(imageURL))
            },
            event.threadID
        );
    },
};
