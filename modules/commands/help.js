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

// تحويل رقم إلى رموز ①②③… (حتى 20 أمر تقريباً)
function numberToCircle(num) {
    const circleNums = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
    return circleNums[num - 1] || num;
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
            ar: '   {pn}\n   {pn} <اسم_الأمر>\n   {pn} <رقم_القائمة>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const input = args[0]; // ممكن يكون اسم أمر أو رقم القائمة

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
        // إذا كان المستخدم كتب رقم القائمة
        // =================================
        const allCommands = Object.values(commands)
            .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index)
            .map(c => c.name);

        const totalCommands = allCommands.length;
        const chunkSize = Math.ceil(totalCommands / 3);
        const pages = [];
        for (let i = 0; i < 3; i++) {
            const commandsChunk = allCommands.slice(i * chunkSize, (i + 1) * chunkSize);
            if (commandsChunk.length === 0) continue;

            let message = `قائمة الأوامر ${i + 1}:\n\n`;
            commandsChunk.forEach((cmd, idx) => {
                message += `${numberToCircle(idx + 1)} ${cmd}\n`;
            });

            pages.push(message);
        }

        // =================================
        // إذا كتب المستخدم رقم قائمة
        // =================================
        if (input && ['1','2','3'].includes(input)) {
            const pageIndex = parseInt(input) - 1;
            if (pages[pageIndex]) {
                return api.sendMessage(pages[pageIndex], event.threadID);
            } else {
                return api.sendMessage(`❌ لا توجد قائمة بالأمر رقم ${input}`, event.threadID);
            }
        }

        // =================================
        // إذا كتب المستخدم اسم أمر محدد
        // =================================
        if (input && !['1','2','3'].includes(input)) {
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
        // إذا لم يكتب المستخدم شيء: عرض القائمة 1 افتراضياً
        // =================================
        return api.sendMessage(pages[0], event.threadID);
    },
                        }
