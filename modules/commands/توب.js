module.exports = {
  config: {
    name: "توب",
    version: "1.0",
    author: "MMORPG Core",
    countDown: 5,
    prefix: true,
    description: "ترتيب اللاعبين",
    category: "mmorpg"
  },

  onStart: async ({ api, event, usersData }) => {

    const all = await usersData.getAll();
    const players = all.filter(u => u.rpg);

    players.sort((a, b) => b.rpg.level - a.rpg.level);

    let msg = "👑 أقوى 10 لاعبين:\n\n";

    players.slice(0, 10).forEach((u, i) => {
      msg += `${i + 1}. Level ${u.rpg.level}\n`;
    });

    api.sendMessage(msg, event.threadID);
  }
};
