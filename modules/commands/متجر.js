module.exports = {
  config: {
    name: "متجر",
    version: "2.0",
    author: "MMORPG Core",
    countDown: 5,
    prefix: true,
    description: "شراء معدات",
    category: "mmorpg"
  },

  onStart: async ({ api, event, args, usersData }) => {

    const items = {
      "سيف_ناري": { price: 1000, type: "weapon", power: 30 },
      "درع_اسطوري": { price: 1200, type: "armor", power: 40 }
    };

    if (!args[0])
      return api.sendMessage("المتوفر: سيف_ناري | درع_اسطوري", event.threadID);

    const item = items[args[0]];
    if (!item)
      return api.sendMessage("❌ عنصر غير موجود.", event.threadID);

    let user = await usersData.get(event.senderID);

    if (!user?.rpg)
      return api.sendMessage("أنشئ شخصية أولاً!", event.threadID);

    if (user.rpg.money < item.price)
      return api.sendMessage("💰 فلوسك ما كافية.", event.threadID);

    user.rpg.money -= item.price;
    user.rpg.inventory.push(args[0]);

    await usersData.set(event.senderID, user);

    api.sendMessage(`🛒 اشتريت ${args[0]} بنجاح!`, event.threadID);
  }
};
