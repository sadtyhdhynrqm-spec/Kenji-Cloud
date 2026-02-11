const { inspect } = require('util');

module.exports = {
    config: {
        name: 'سيرفر',
        version: '1.0',
        author: 'bestgamershk',
        countDown: 5,
        prefix: true,
        adminOnly: true, // أي مشرف أو مطور يستطيع استخدامه
        description: 'Reset (delete) All settings for the server.',
        category: 'owner',
        guide: {
            ar: '{pn}resetsettings (ستتم إعادة تعيين جميع الإعدادات)'
        },
    },

    onStart: async ({ client, event, args, isAdmin }) => {
        const message = event; // بنفس تسمية المتغير لتوافق الكود القديم

        if (!isAdmin || !client.config.ownerIDS.includes(message.author.id)) {
            let es = client.settings.get(message.guild.id, "embed");
            return message.channel.send({ embeds: [{
                color: es.wrongcolor,
                footer: client.getFooter(es),
                title: '❌ ليس لديك صلاحية استخدام هذا الأمر!',
                description: 'هذا الأمر خاص بالمطورين فقط.'
            }]});
        }

        try {
            let es = client.settings.get(message.guild.id, "embed");
            message.channel.send('🔂 هل أنت متأكد أنك تريد إعادة تعيين جميع الإعدادات؟ اكتب "yes" للتأكيد.').then(msg => {
                msg.channel.awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 30e3, errors: ["time"] })
                .then(collected => {
                    if (collected.first().content.toLowerCase() === "yes") {
                        // حذف جميع الإعدادات
                        client.youtube_log.delete(message.guild.id);
                        client.premium.delete(message.guild.id);
                        client.stats.delete(message.guild.id);
                        client.settings.delete(message.guild.id);
                        client.jtcsettings.delete(message.guild.id);
                        client.jtcsettings2.delete(message.guild.id);
                        client.jtcsettings3.delete(message.guild.id);
                        client.jointocreatemap.delete(message.guild.id);
                        client.setups.delete(message.guild.id);
                        client.queuesaves.delete(message.guild.id);
                        client.modActions.delete(message.guild.id);
                        client.userProfiles.delete(message.guild.id);
                        client.apply.delete(message.guild.id);
                        client.apply2.delete(message.guild.id);
                        client.apply3.delete(message.guild.id);
                        client.apply4.delete(message.guild.id);
                        client.apply5.delete(message.guild.id);
                        client.points.delete(message.guild.id);
                        client.voicepoints.delete(message.guild.id);
                        client.reactionrole.delete(message.guild.id);
                        client.roster.delete(message.guild.id);
                        client.roster2.delete(message.guild.id);
                        client.roster3.delete(message.guild.id);
                        client.social_log.delete(message.guild.id);
                        client.blacklist.delete(message.guild.id);
                        client.customcommands.delete(message.guild.id);
                        client.keyword.delete(message.guild.id);

                        es = client.settings.get(message.guild.id, "embed");

                        const successMessage =
                            `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n` +
                            `✅ تم إعادة تعيين جميع الإعدادات بنجاح!\n` +
                            `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯`;
                        return message.channel.send(successMessage);
                    } else {
                        const cancelMessage =
                            `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n` +
                            `❌ تم إلغاء إعادة التعيين.\n` +
                            `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯`;
                        return message.channel.send(cancelMessage);
                    }
                });
            });

        } catch (err) {
            let es = client.settings.get(message.guild.id, "embed");
            return message.channel.send(
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯\n` +
                `❌ حدث خطأ أثناء تنفيذ الأمر:\n${err.message}\n` +
                `◯⊰▰▱▱▰▱▰▱▰▱▰⊱◯`
            );
        }
    },
};
