module.exports = {
  config: {
    name: "تجهيز",
    version: "1.0",
    author: "MMORPG Core",
    countDown: 5,
    prefix: true,
    description: "تجهيز عنصر من الحقيبة",
    category: "mmorpg"
  },

  onStart: async ({ api, event, args, usersData }) => {

    if (!args[0])
      return api.sendMessage("اكتب اسم العنصر لتجهيزه.", event.threadID);

    let user = await usersData.get(event.senderID);

    if (!user?.rpg)
      return api.sendMessage("أنشئ شخصية أولاً!", event.threadID);

    if (!user.rpg.inventory.includes(args[0]))
      return api.sendMessage("❌ العنصر غير موجود في حقيبتك.", event.threadID);

    if (args[0].includes("سيف"))
      user.rpg.weapon = args[0];

    if (args[0].includes("درع"))
      user.rpg.armor = args[0];

    await usersData.set(event.senderID, user);

    api.sendMessage(`⚔️ تم تجهيز ${args[0]}!`, event.threadID);
  }
};
