const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: 'سيرفر',
        version: '1.0',
        author: 'bestgamershk',
        countDown: 5,
        prefix: true,
        adminOnly: true,
        description: 'Reset (delete) All settings for the server.',
        category: 'owner',
        guide: {
            ar: '{pn}resetsettings (ستتم إعادة تعيين جميع الإعدادات)'
        },
    },

    onStart: async ({ client, event, args, isAdmin }) => {
        const message = event;

        // تحقق من صلاحيات المطور/المشرف
        if (!isAdmin || !client.config.ownerIDS.includes(message.author.id)) {
            let es = client.settings.get(message.guild.id, "embed") || {};
            return message.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor(es.wrongcolor || 'Red')
                    .setFooter({ text: es.footer || '' })
                    .setTitle('انت عيان انغلع ')
                    .setDescription('هذا الأمر خاص بالمطورين فقط.')
                ]
            });
        }

        try {
            const es = client.settings.get(message.guild.id, "embed") || {};
            const promptMsg = await message.channel.send('🔂 هل تريد اعادت تهيل السيربر؟ "yes" للتأكيد.');

            const filter = m => m.author.id === message.author.id;
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });

            if (collected.first().content.toLowerCase() === 'yes') {
                // حذف جميع الإعدادات
                const dbs = [
                    'youtube_log','premium','stats','settings','jtcsettings','jtcsettings2','jtcsettings3',
                    'jointocreatemap','setups','queuesaves','modActions','userProfiles','apply','apply2',
                    'apply3','apply4','apply5','points','voicepoints','reactionrole','roster','roster2',
                    'roster3','social_log','blacklist','customcommands','keyword'
                ];

                for (const db of dbs) {
                    if (client[db] && typeof client[db].delete === 'function') {
                        client[db].delete(message.guild.id).catch(() => {});
                    }
                }

                return message.channel.send(
                    '◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n✅ تم إعادة تعيين جميع الإعدادات بنجاح!\n◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯'
                );
            } else {
                return message.channel.send(
                    '◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n❌ تم إلغاء إعادة التعيين.\n◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯'
                );
            }

        } catch (err) {
            console.error(err); // هذا سيساعدك على رؤية الخطأ في الكونسول
            return message.channel.send(
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n❌ حدث خطأ أثناء تنفيذ الأمر:\n${err.message}\n◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯`
            );
        }
    },
};
