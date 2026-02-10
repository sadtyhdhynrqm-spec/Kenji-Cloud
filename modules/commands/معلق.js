const fs = require("fs-extra");
const path = require("path");

// مسار تخزين القائمة السوداء
const blacklistPath = path.join(__dirname, "cache", "blacklist.json");

module.exports.config = {
  name: "معلق",
  version: "5.0.0",
  hasPermssion: 2,
  description: "إدارة طلبات الانضمام والقائمة السوداء",
  commandCategory: "المطور",
  usages: "[u/t/a/احصائيات/فحص]",
  cooldowns: 5
};

function getBlacklist() {
  if (!fs.existsSync(blacklistPath)) fs.writeJsonSync(blacklistPath, []);
  return fs.readJsonSync(blacklistPath);
}

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, threadID, messageID } = event;

  if (body.toLowerCase().startsWith("رفض") || body.toLowerCase().startsWith("حظر")) {
    const isBan = body.toLowerCase().startsWith("حظر");
    const indexes = body.replace(/رفض|حظر/g, "").trim().split(/\s+/);
    let bl = getBlacklist();

    for (const i of indexes) {
      const target = handleReply.pending[i - 1];
      if (!target) continue;

      await api.sendMessage(
        `⚠️ تم رفض طلبكم ${isBan ? "وحظر المجموعة" : ""}.`,
        target.threadID
      );

      if (isBan) {
        bl.push(target.threadID);
        fs.writeJsonSync(blacklistPath, bl);
      }

      api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
    }

    return api.sendMessage(
      `✅ تم تنفيذ ${isBan ? "الحظر" : "الرفض"} على (${indexes.length}) طلب.`,
      threadID,
      messageID
    );

  } else {
    const indexes = body.split(/\s+/);

    for (const i of indexes) {
      const target = handleReply.pending[i - 1];
      if (!target) continue;

      api.unsendMessage(handleReply.messageID);
      api.changeNickname(`[ BOT ]`, target.threadID, api.getCurrentUserID());

      api.sendMessage(
        `✅ تم تفعيل النظام بنجاح.\nحالة البوت: نشط الآن\nاكتب (الاوامر) للبدء.`,
        target.threadID
      );
    }

    return api.sendMessage(
      `✅ تم تفعيل البوت في المجموعات المختارة.`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async function({ api, event, args }) {
  if (event.senderID !== global.config.DEVELOPER_ID) 
    return api.sendMessage("❌ هذا الأمر للمطور فقط.", event.threadID, event.messageID);

  if (args[0] === "احصائيات") {
    const active = await api.getThreadList(100, null, ["INBOX"]);
    const pending = await api.getThreadList(100, null, ["PENDING", "OTHER"]);

    return api.sendMessage(
      `📊 إحصائيات البوت:\n━━━━━━━━━━━━━\n🟢 مفعلة: ${active.length}\n⏳ قيد الانتظار: ${pending.length}\n🚫 المحظورة: ${getBlacklist().length}`,
      event.threadID
    );
  }

  try {
    let list = [...(await api.getThreadList(100, null, ["OTHER"])), ...(await api.getThreadList(100, null, ["PENDING"]))];

    if (args[0] === "u") list = list.filter(i => !i.isGroup);
    if (args[0] === "t") list = list.filter(i => i.isGroup);

    if (list.length === 0) return api.sendMessage("📭 القائمة فارغة حالياً.", event.threadID);

    let msg = `📥 طلبات التحكم:\n━━━━━━━━━━━━━\n`;
    list.forEach((s, i) => {
      msg += `[${i + 1}] ${s.name}\nID: ${s.threadID}\n\n`;
    });
    msg += `━━━━━━━━━━━━━\n💡 رد برقم للقبول\n💡 رد بـ (رفض/حظر + رقم) للتعامل`;

    return api.sendMessage(
      msg,
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          pending: list
        });
      },
      event.messageID
    );
  } catch (e) {
    return api.sendMessage("❌ فشل في جلب البيانات.", event.threadID);
  }
};
