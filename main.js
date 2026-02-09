const fs = require('fs-extra');
const express = require('express');
const login = require('fca-priyansh');
const { loadCommands, handleCommand } = require('./handler/command');
const handleEvent = require('./handler/event');
const { handleMessage } = require('./handler/message');
const { log } = require('./logger/logger');
const config = require('./config/config.json');

const app = express();
app.use(express.static('public'));

app.get('/config', (req, res) => {
  res.json(config);
});

app.get('/command-count', (req, res) => {
  res.json({ count: global.client.commands.size });
});

const chalk = require('chalk');
const axios = require('axios');

const gradient = chalk.bold.green;

function _0x4210(_0x1c3be3,_0x2b4807){const _0x2629ef=_0x2629();return _0x4210=function(_0x42102a,_0x253f34){_0x42102a=_0x42102a-0x175;let _0x2398db=_0x2629ef[_0x42102a];return _0x2398db;},_0x4210(_0x1c3be3,_0x2b4807);}
(function(_0x45495e,_0x1bc14f){
  const _0xbb3a03=_0x4210,_0x397d11=_0x45495e();
  while(!![]){
    try{
      const _0x156aa6=
        -parseInt(_0xbb3a03(0x17c))/0x1+
        parseInt(_0xbb3a03(0x177))/0x2+
        parseInt(_0xbb3a03(0x179))/0x3*(-parseInt(_0xbb3a03(0x17f))/0x4)+
        -parseInt(_0xbb3a03(0x180))/0x5+
        parseInt(_0xbb3a03(0x17e))/0x6+
        parseInt(_0xbb3a03(0x17d))/0x7*(parseInt(_0xbb3a03(0x176))/0x8)+
        parseInt(_0xbb3a03(0x185))/0x9;
      if(_0x156aa6===_0x1bc14f) break;
      else _0x397d11.push(_0x397d11.shift());
    }catch(_0x3d3105){
      _0x397d11.push(_0x397d11.shift());
    }
  }
}(_0x2629,0xa5d0b));

const displayBanner = async () => {
  try {
    const res = await axios.get(
      'https://raw.githubusercontent.com/1dev-hridoy/1dev-hridoy/refs/heads/main/kenji.txt'
    );
    const banner = Buffer.from(res.data, 'base64').toString('utf8');
    console.log(gradient(banner));
  } catch (e) {
    console.error('Failed to fetch or display banner:', e);
  }
};

function _0x2629(){
  const _0x344e67=[
    'utf8',
    'https://raw.githubusercontent.com/1dev-hridoy/1dev-hridoy/refs/heads/main/kenji.txt',
    '15576021sqzZsD',
    'get',
    'base64',
    'from',
    '8pMmcBO',
    '768620xfWmRT',
    '95025lzGESC',
    'data',
    '531783KBLfqb',
    '3019163HiDTuy',
    '3233130RQiHFc',
    '76aqcZkt',
    '6361780JToHNs',
    'error'
  ];
  _0x2629 = function(){ return _0x344e67; };
  return _0x2629();
}

const initializeBot = async () => {
  await displayBanner();
  console.log(chalk.bold.cyan('Loading commands...'));

  try {
    if (!fs.existsSync('./appstate.json')) {
      log('error', 'appstate.json not found.');
      process.exit(1);
    }

    const appState = fs.readJsonSync('./appstate.json');
    if (!Array.isArray(appState) || appState.length === 0) {
      log('error', 'appstate.json is invalid or empty.');
      process.exit(1);
    }

    let attempts = 0;
    const maxAttempts = 3;
    let api;

    while (attempts < maxAttempts) {
      try {
        api = await new Promise((resolve, reject) => {
          login({ appState }, (err, api) => {
            if (err) return reject(err);
            resolve(api);
          });
        });
        break;
      } catch (error) {
        attempts++;
        log('error', `Login attempt ${attempts} failed: ${error.message}`);
        if (attempts >= maxAttempts) {
          process.exit(1);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    api.setOptions({ listenEvents: true, selfListen: true, forceLogin: true });

    global.client = {
      handleReply: [],
      commands: new Map(),
      events: new Map(),
      config
    };

    const commands = loadCommands();
    commands.forEach((cmd, name) => global.client.commands.set(name, cmd));

    api.listenMqtt(async (err, event) => {
      if (err) return log('error', err.message);

      if (event.type === 'event') {
        await handleEvent(event, api);
      } else if (event.type === 'message' || event.type === 'message_reply') {
        await handleMessage(event, api, commands);
      }
    });

    const port = process.env.PORT || 20170;
    app.listen(port, () => log('info', `Web server running on port ${port}`));

    log('info', 'Bot initialized successfully');

    // ✅ الرسالة المعدلة هنا
    if (fs.existsSync('./restart.json')) {
      const restartInfo = fs.readJsonSync('./restart.json');
      api.sendMessage(
        "ابلين اعادت التشقيل 🔂 🖤",
        restartInfo.threadID
      );
      fs.removeSync('./restart.json');
    }

    process.on('SIGINT', () => {
      log('info', 'Bot stopped');
      process.exit(0);
    });

  } catch (error) {
    log('error', error.message);
    process.exit(1);
  }
};

fs.removeSync('./PriyanshFca.json');
initializeBot();
