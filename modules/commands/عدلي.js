const Jimp = require("jimp");
const Canvacord = require("canvacord");
const fs = require("fs");
const remobg = require("remove.bg");

const RBG_KEYS = [
    "cHLxHkyovvnFKA46bWDoy5ab0",
    "tgrhopqLJG5cz17zr9GFVRSP",
    "dCtKvWzkwn4eAYkxF3jUg95h",
    "FxhCoWrhbjE5rGdQcQXrR6L1",
    "xw2tzRUfTwNpPCqApBk3PMgP"
];

module.exports = {
    config: {
        name: "عدلي",
        version: "2.0",
        author: "FantoX",
        countDown: 0,
        prefix: true,
        adminOnly: false,
        description: "تعديل الصور بشكل ذكي وحر: blur, circle, jail, removebg",
        category: "fun",
        guide: {
            ar: "{pn}imageedit (أو الرد على صورة مع أي وصف)"
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const text = args.join(" ").toLowerCase(); // وصف المستخدم

        if (!event.messageReply || !event.messageReply.attachments?.[0]) {
            return api.sendMessage("❌ الرجاء الرد على صورة لتطبيق التعديل!", threadID, messageID);
        }

        const imageBuffer = await event.messageReply.download();

        try {
            // 1️⃣ تحديد نوع التعديل تلقائيًا حسب النص
            let applied = false;

            // blur
            if (text.includes("blur") || text.includes("ضبابية")) {
                let level = parseInt(text.match(/\d+/)) || 5;
                const img = await Jimp.read(imageBuffer);
                img.blur(level);
                img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                    if (!err) api.sendMessage({ image: buffer, caption: "_تم التعديل: blur_" }, threadID, messageID);
                });
                applied = true;
            }

            // circle
            if (text.includes("circle") || text.includes("دائرة")) {
                const img = await Jimp.read(imageBuffer);
                img.circle();
                img.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
                    if (!err) api.sendMessage({ image: buffer, caption: "_تم التعديل: circle_" }, threadID, messageID);
                });
                applied = true;
            }

            // jail
            if (text.includes("jail") || text.includes("سجن")) {
                const result = await Canvacord.jail(imageBuffer, false);
                api.sendMessage({ image: result, caption: "_تم التعديل: jail_" }, threadID, messageID);
                applied = true;
            }

            // removebg
            if (text.includes("removebg") || text.includes("خلفية")) {
                const rbgKEY = RBG_KEYS[Math.floor(Math.random() * RBG_KEYS.length)];
                const inputFile = "./System/Cache/input.png";
                const outputFile = "./System/Cache/removeBgOUT.png";
                fs.writeFileSync(inputFile, imageBuffer);

                await remobg.removeBackgroundFromImageFile({
                    path: inputFile,
                    apiKey: rbgKEY,
                    size: "regular",
                    type: "auto",
                    scale: "100%",
                    outputFile,
                });

                api.sendMessage({ image: fs.readFileSync(outputFile), caption: "_تم التعديل: removebg_" }, threadID, messageID);

                fs.unlinkSync(inputFile);
                fs.unlinkSync(outputFile);
                applied = true;
            }

            // إذا لم يفهم أي تعديل
            if (!applied) {
                api.sendMessage("❌ لم أتمكن من تحديد تعديل من رسالتك، يمكنك كتابة blur, circle, jail, removebg أو وصف بالعربية.", threadID, messageID);
            }
        } catch (err) {
            console.error(err);
            api.sendMessage(`❌ حدث خطأ أثناء التعديل: ${err.message}`, threadID, messageID);
        }
    },
};
