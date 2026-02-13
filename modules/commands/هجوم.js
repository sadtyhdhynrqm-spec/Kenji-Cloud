let bossHP = 3000;

module.exports = {
  config: {
    name: "هجوم",
    version: "1.0",
    author: "MMORPG Core",
    countDown: 5,
    prefix: true,
    description: "مهاجمة الزعيم",
    category: "mmorpg"
  },

  onStart: async ({ api, event, usersData }) => {

    let user = await usersData.get(event.senderID);

    if (!user?.rpg)
      return api.sendMessage("أنشئ شخصية أولاً!", event.threadID);

    let damage = Math.floor(Math.random() * 60) + 20;

    bossHP -= damage;

    if (bossHP <= 0) {
      bossHP = 3000;
      user.rpg.money += 1000;
      user.rpg.xp += 300;

      await usersData.set(event.senderID, user);

      return api.sendMessage(
        `🐉 تم قتل الزعيم!\n🏆 حصلت على 1000$ و 300XP`,
        event.threadID
      );
    }

    api.sendMessage(`⚔️ ضربت الزعيم ${damage}\n❤️ HP المتبقي: ${bossHP}`, event.threadID);
  }
};
