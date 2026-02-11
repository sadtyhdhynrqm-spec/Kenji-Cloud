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
    // تقسيم الأوامر حسب الفئة مع الشكل الجديد
    // =========================
    const categories = {};

    const categoryMap = {
        'group': 'المجموعة',
        'Group': 'المجموعة',
        'image': 'الصور',
        'وسائط': 'وسائط',
        'media': 'وسائط',
        'admin': 'الخـدمات السريعة',
        'fun': 'اللـعب الممتع',
        'random': 'عشوائي',
        'music': 'الموسيقى',
        'video': 'الفيديو',
        'ai': 'الذكاء AI الأقوى',
        'tools': 'الآداوات المبتكرة',
        'utility': 'أدوات مساعدة',
        'owner': 'المطور',
        'level': 'المستوى',
        'game': 'اللـعب الممتع',
        'play': 'اللـعب الممتع',
    };

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
        'وسائط', 'الذكاء AI الأقوى', 'الخـدمات السريعة',
        'الآداوات المبتكرة', 'اللـعب الممتع', 'المجموعة',
        'الموسيقى', 'الفيديو', 'عشوائي', 'المستوى', 'المطور', 'أخرى'
    ];

    let finalMessage = "";

    for (const category of orderedCats) {
        const cmds = finalCategories[category];
        if (!cmds || cmds.length === 0) continue;

        // إخفاء فئة المطور لغير المطور
        if (category === "المطور" && !config.adminBot?.includes(event.senderID)) continue;

        // تقسيم الأوامر في أسطر 3 لكل سطر
        let lines = [];
        for (let i = 0; i < cmds.length; i += 3) {
            lines.push("│ ⌯  " + cmds.slice(i, i + 3).join("  ⌯  "));
        }

        finalMessage +=
`╭───── •✧• ─────
│       🪙 ${category}
├
${lines.join('\n')}
╰───── •✧• ─────
`;
    }

    // صورة خلفية
    const imageURL = 'https://i.ibb.co/rKsDY73q/1768624739835.jpg';

    return api.sendMessage(
        {
            body: finalMessage.trim() + `\n≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡\n『عدد الاوامر: ${uniqueCommands.length}』`,
            attachment: fs.createReadStream(await downloadImage(imageURL))
        },
        event.threadID
    );
                }
