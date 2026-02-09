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
        description: 'يعرض لك قائمة الأوامر أو تفاصيل أمر محدد.',
        category: 'أدوات',
        guide: {
            ar: '   {pn}\n   {pn} <اسم_الأمر>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const input = args[0]; // ممكن يكون اسم أمر

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

        const allCommands = Object.values(commands)
            .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index)
            .map(c => c.name);

        // =================================
        // إذا كتب المستخدم اسم أمر محدد
        // =================================
        if (input && !allCommands.includes(input)) {
            const commandConfig = commands[input.toLowerCase()];
            if (commandConfig) {
                let detailMessage = '';
                detailMessage += `معلومات الأمر:\n\n`;
                detailMessage += `الاسم: ${commandConfig.name}\n`;
                detailMessage += `الوصف: ${commandConfig.description}\n`;
                detailMessage += `المؤلف: ${commandConfig.author}\n`;
                detailMessage += `الإصدار: ${commandConfig.version}\n`;
                if (commandConfig.aliases && commandConfig.aliases.length > 0) {
                    detailMessage += `الأسماء المستعارة: ${commandConfig.aliases.join(', ')}\n`;
                }
                if (commandConfig.guide && commandConfig.guide.ar) {
                    detailMessage += `الاستخدام:\n${commandConfig.guide.ar.replace(/{pn}/g, config.prefix + commandConfig.name)}\n`;
                }

                return api.sendMessage(detailMessage, event.threadID);
            } else {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }
        }

        // =================================
        // عرض كل الأوامر مع صورة
        // =================================
        const commandsList = allCommands.join(' ⎆ ');
        const finalMessage = `❖━┄⋄┄━╃⊱✅ابلين✅⊰╄━┄⋄┄━❖\n${commandsList}`;
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

// =================================
// دالة مساعدة لتحميل الصورة مؤقتاً من الإنترنت
// =================================
const axios = require('axios');
const fsExtra = require('fs-extra');

async function downloadImage(url) {
    const pathTemp = path.join(__dirname, 'temp_image.jpg');
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    fsExtra.writeFileSync(pathTemp, response.data);
    return pathTemp;
    }
