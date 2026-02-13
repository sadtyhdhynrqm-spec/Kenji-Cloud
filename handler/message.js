const { handleCommand } = require('./command');
const { Users, Threads } = require('../database/database');
const config = require('../config/config.json');
const { log } = require('../logger/logger');

const handleMessage = async (event, api, commands) => {
  try {
    if (event.type !== 'message' && event.type !== 'message_reply' || !event.body) return;

 
    const [userInfo, threadInfo] = await Promise.all([
      api.getUserInfo(event.senderID).catch(() => ({ [event.senderID]: { name: "User" } })),
      api.getThreadInfo(event.threadID).catch(() => ({ name: "Group" }))
    ]);

    const userName = userInfo[event.senderID]?.name || 'User';
    const threadName = threadInfo?.name || 'Group';

    // Ensure thread and user exist in database immediately
    await Threads.create(event.threadID, threadName);
    await Users.create(event.senderID, userName);

  
    const userData = Users.get(event.senderID);
    const threadData = Threads.get(event.threadID);

    userData.name = userName; 
    userData.messageCount = (userData.messageCount || 0) + 1;
    userData.lastActive = new Date().toISOString();

  
    const xpToGive = Math.floor(Math.random() * 10) + 5;
    userData.xp = (userData.xp || 0) + xpToGive;
    userData.totalxp = (userData.totalxp || 0) + xpToGive;
    const requiredXp = 5 * Math.pow(userData.rank + 1, 2);
    if (userData.xp >= requiredXp) {
      userData.rank++;
      userData.xp -= requiredXp;
    
    }
    Users.set(event.senderID, userData);

   
    threadData.name = threadName; 
    Threads.set(event.threadID, threadData);


    const body = event.body || '';
    if (!body) return;

    const isGroup = event.isGroup;
    const messageType = event.attachments && event.attachments.length > 0 ? 'media' : 'text';
    const mediaUrl = event.attachments && event.attachments.length > 0 ? event.attachments[0].url || 'N/A' : 'N/A';
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const logMessage = `${time} - ${userName} (${isGroup ? 'Group' : 'Private'}) - Type: ${messageType} - Message: ${body} - Media URL: ${mediaUrl}`;
    log('info', logMessage);

  
    if (event.messageReply) {
      const { handleReply } = global.client;
      const { messageID, threadID, messageReply } = event;
      if (handleReply.length > 0) {
        const reply = handleReply.find(r => r.messageID === messageReply.messageID);
        if (reply) {
          const command = global.client.commands.get(reply.name);
          if (command && command.handleReply) {
            await command.handleReply({ event, api, handleReply: reply });
          }
        }
      }
    }

    const currentPrefix = threadData?.settings?.prefix || config.prefix;
    const commandName = body.split(' ')[0].toLowerCase();
    const commands = global.client.commands; 


    const noPrefixCommand = commands.get(commandName) || Array.from(commands.values()).find(cmd => cmd.config.aliases?.includes(commandName));
    if (noPrefixCommand && noPrefixCommand.config.prefix === false) {
      const args = body.trim().split(/\s+/);
      if (args.length === 0) return;
      await handleCommand({ message: body, args, event, api, Users, Threads, commands, config: global.client.config });
      return;
    }

    
    if (body.startsWith(currentPrefix)) {
      const args = body.slice(currentPrefix.length).trim().split(/\s+/);
      if (args.length === 0 || (args.length === 1 && args[0] === "")) {
        return api.sendMessage("🫦", event.threadID, event.messageID);
      }
      await handleCommand({ message: body, args, event, api, Users, Threads, commands, config: global.client.config });
    }
  } catch (error) {
    log('error', `Message handling error: ${error.message}`);
  }
};

module.exports = { handleMessage };
