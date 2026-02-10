const fs = require("fs-extra");
const path = require("path");

// 🧠 تخزين مؤقت لاختيار القروبات
const pendingAddPath = path.join(__dirname, "cache", "pendingAdd.json");

module.exports.config = {
  name: "ضيفني",
  version: "5.0.0",
  hasPermssion: 2, // 2 يعني أدمن
  description: "إضافة المطور إلى القروبات",
  commandCategory: "المطور",
  usages: "ضيفني",
  cooldowns: 5
};

// 👤 معرف المطور
const DEVELOPER_ID = "61586897962846";

// دالة لحفظ واسترجاع الاختيارات المؤقتة
function getPendingAdd() {
  if (!fs.existsSync(pendingAddPath)) fs.writeJsonSync(pendingAddPath, {});
  return fs.readJsonSync(pendingAddPath);
}

function savePendingAdd(data) {
  fs.writeJsonSync(pendingAddPath, data);
}

// 👥 التعامل مع الردود
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, threadID, messageID } = event;

  try {
    const pendingData = getPendingAdd();
    const userPending = pendingData[event.senderID];
    if (!userPending) return;

    const index = Number(body) - 1;
    const group = userPending[index];
    if (!group) return api.sendMessage("❌ الرقم دا ما صاح", threadID, messageID);

    try {
      await api.addUserToGroup(DEVELOPER_ID, group.threadID);
      await api.sendMessage("✅ المطور دخل القروب ✌️🔥", group.threadID);
      await api.sendMessage(`✔️ تمام، دخلناك قروب:\n${group.name}`, threadID, messageID);
    } catch {
      await api.sendMessage("⚠️ ما قدرنا نضيفك (يمكن إنت موجود أصلاً)", threadID, messageID);
    }

    // إزالة الطلب بعد التنفيذ
    userPending.splice(index, 1);
    if (userPending.length === 0) delete pendingData[event.senderID];
    savePendingAdd(pendingData);

  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ حدث خطأ أثناء التنفيذ.", threadID, messageID);
  }
};

// 🏃 تنفيذ الأمر
module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  try {
    if (senderID !== DEVELOPER_ID)
      return api.sendMessage("❌ يا زول الأمر دا للمطور بس", threadID, messageID);

    // جلب القروبات المفعلة
    const threads = await api.getThreadList(50, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup);

    if (!groups.length)
      return api.sendMessage("⚠️ ما في قروبات متاحة هسع", threadID, messageID);

    // حفظ القروبات للمستخدم
    const pendingData = getPendingAdd();
    pendingData[senderID] = groups;
    savePendingAdd(pendingData);

    let msg = "⌈  💠 القروبات الموجودة 💠⌋\n━━━━━━━━━━━━━\n";
    groups.forEach((g, i) => {
      msg += `[${i + 1}] ${g.name}\nID: ${g.threadID}\n\n`;
    });
    msg += "━━━━━━━━━━━━━\n💡 رد برقم القروب للدخول";

    // التأكد من وجود handleReply عالمي
    if (!global.client.handleReply) global.client.handleReply = [];
    api.sendMessage(msg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        pending: groups
      });
    }, messageID);

    // ⏳ حذف الطلب بعد دقيقة
    setTimeout(() => {
      const data = getPendingAdd();
      delete data[senderID];
      savePendingAdd(data);
    }, 60_000);

  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ فشل في جلب البيانات.", threadID, messageID);
  }
};
