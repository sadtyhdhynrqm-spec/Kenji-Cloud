module.exports = {
  config: {
    name: "ارينا",
    version: "1.0",
    author: "MMORPG Core",
    countDown: 20,
    prefix: true,
    description: "تحدي لاعب في ارينا",
    category: "mmorpg"
  },

  onStart: async ({ api, event, usersData }) => {
    const opponentID = Object.keys(event.mentions)[0];
    if (!opponentID)
      return api.sendMessage("منشن لاعب للتحدي ⚔️", event.threadID);

    let p1 = await usersData.get(event.senderID);
    let p2 = await usersData.get(opponentID);

    if (!p1?.rpg || !p2?.rpg)
      return api.sendMessage("كلا اللاعبين لازم يكون عندهم شخصية.", event.threadID);

    let hp1 = p1.rpg.maxHp;
    let hp2 = p2.rpg.maxHp;

    let log = "⚔️ بدأت المعركة!\n\n";

    for (let round = 1; round <= 3; round++) {
      if (hp1 <= 0 || hp2 <= 0) break;

      let dmg1 = Math.floor(Math.random() * 40) + (p1.rpg.weapon ? 20 : 10);
      let dmg2 = Math.floor(Math.random() * 40) + (p2.rpg.weapon ? 20 : 10);

      hp2 -= dmg1;
      hp1 -= dmg2;

      log += `🔁 الجولة ${round}\n`;
      log += `👤1 ضرب ${dmg1}\n`;
      log += `👤2 ضرب ${dmg2}\n\n`;
    }

    let winner = hp1 > hp2 ? event.senderID : opponentID;
    let winData = await usersData.get(winner);

    winData.rpg.money += 400;
    winData.rpg.xp += 120;

    await usersData.set(winner, winData);

    log += "🏆 الفائز حصل على 400$ و 120XP";

    api.sendMessage(log, event.threadID);
  }
};
