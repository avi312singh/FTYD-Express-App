require('dotenv').config();
// require('events').EventEmitter.defaultMaxListeners = 25;
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require('./commands');
const express = require('express');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');

const serverStats = require('./routes/serverstats');
const aggregatedStats = require('./routes/aggregatedstats');
const repeatedRequests = require('./routes/repeatedRequests');
const dbInteractions = require('./routes/dbInteractions');

Object.keys(botCommands).map((key) => {
  bot.commands.set(botCommands[key].name, botCommands[key]);
});

const basicAuthUsername =
  process.env.BASICAUTHUSERNAME ||
  (() => {
    new Error('Provide a basic auth username in env vars');
  });
const basicAuthPassword =
  process.env.BASICAUTHPASSWORD ||
  (() => {
    new Error('Provide a basic auth password in env vars');
  });
const port =
  process.env.PORT ||
  (() => {
    new Error('Provide a basic auth password in env vars');
  });

const users = {};
users[basicAuthUsername] = basicAuthPassword;

const app = express();

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log(`App is running, server is listening on port ${port}`);
});

app.get('/', function (request, response) {
  const result = 'App is running';
  response.status(200).json({ status: result });
});

app.use(cors());
app.use(helmet());

// app.use(
//   basicAuth({
//     users: {
//       avi312: basicAuthPassword,
//     },
//     unauthorizedResponse: {
//       message: 'Bad credentials',
//     },
//     challenge: true,
//   })
// );

app.use('/serverStats', serverStats);
app.use('/aggregatedStats', aggregatedStats);
app.use('/repeatedRequests', repeatedRequests);
app.use('/dbInteractions', dbInteractions);

// //For avoiding Heroku $PORT error
// app.get('/', function (request, response) {
//   const result = 'App is running'
//   response.status(200).json({ status: result });
// }).listen(app.get('port'), function () {
//   console.log('App is running, server is listening on port ', app.get('port'));
// });

// const TOKEN = process.env.TOKEN;
// bot.login(TOKEN);

// bot.on('ready', () => {
//   console.info(`Logged in as ${bot.user.tag}!`);
// });

// bot.on('message', (msg) => {
//   if (!msg.content.startsWith('!')) return;
//   const args = msg.content.split(/ +/);
//   const command = args.shift().toLowerCase();
//   console.info(`Called command: ${command}`);

//   if (!bot.commands.has(command)) return;

//   try {
//     bot.commands.get(command).execute(msg, args);
//   } catch (error) {
//     console.error(error);
//     msg.reply('there was an error trying to execute that command!');
//   }
// });
