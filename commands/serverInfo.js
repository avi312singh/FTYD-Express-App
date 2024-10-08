const cheerio = require("cheerio");
const query = require("source-server-query");
const axios = require("axios");

async function fetchHTML(url) {
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function serverInfo(queryName) {
  const country = process.env.COUNTRY || "AT";
  const serverIp =
    process.env.SERVERIP ||
    (() => {
      new Error("Provide a server IP in env vars");
    });

  console.log("name to be searched is ", queryName[0]);
  await axios.get(`https://refactor.jp/chivalry/?country=${country}`);
  const $ = await fetchHTML(`https://refactor.jp/chivalry/?country=${country}`);
  let nameToBeSearched = "";
  let serverWebpage = "";
  let lastUpdate = "";
  let directQueryInfo = {};
  let directPlayerInfo = [];
  let allServerInfo = [];
  let serverInfo = {};

  switch (queryName[0]) {
    case "main":
      nameToBeSearched = "*** Fall To Your Death 24/7";
      directQueryInfo = await query
        .info(serverIp, 7779, 2000)
        .then(query.close)
        .catch(console.log);
      directPlayerInfo = await query
        .players(serverIp, 7779, 2000)
        .then(query.close)
        .catch(console.log);
      break;
    case "Main":
      nameToBeSearched = "*** Fall To Your Death 24/7";
      directQueryInfo = await query
        .info(serverIp, 7779, 2000)
        .then(query.close)
        .catch(console.log);
      directPlayerInfo = await query
        .players(serverIp, 7779, 2000)
        .then(query.close)
        .catch(console.log);
      break;
    case "test":
      nameToBeSearched = "FallToYourDeath tests";
      directQueryInfo = await query
        .info(serverIp, 7783, 2000)
        .then(query.close)
        .catch(console.log);
      directPlayerInfo = await query
        .players(serverIp, 7783, 2000)
        .then(query.close)
        .catch(console.log);
      break;
    case "Test":
      nameToBeSearched = "FallToYourDeath tests";
      directQueryInfo = await query
        .info(serverIp, 7783, 2000)
        .then(query.close)
        .catch(console.log);
      directPlayerInfo = await query
        .players(serverIp, 7783, 2000)
        .then(query.close)
        .catch(console.log);
      break;
    default:
      throw new Error(queryName[0] + "is not recognised");
  }
  $(
    "body > div.section > div.contents > div.contentBody > table.serverList.f16 > tbody > tr",
  ).each((index, element) => {
    const tds = $(element).find("td");
    const serverName = $(tds[2]) ? $(tds[2]).text() : "serverName empty";
    const playerAmount = $(tds[3]) ? $(tds[3]).text() : "playerAmount empty";
    const playerAmountWithoutMaxPlayers = playerAmount.replace(/\/(.*)/g, "");
    if (serverName.includes(nameToBeSearched)) {
      serverInfo = {
        serverName: serverName,
        playerAmount: playerAmountWithoutMaxPlayers,
      };
      serverWebpage = $(tds[2])
        ? $(tds[2]).find("a").attr("href")
        : "server webpage not found";
    }
  });

  await axios.get(serverWebpage);
  const $webpage = await fetchHTML(serverWebpage);

  lastUpdate = $webpage(
    "body > div.section > div.heading > div.contents > p.lastUpdate",
  ).text();

  $webpage(
    "body > div.section > div.contents > div.contentBody > table.playerList > tbody > tr",
  ).each((index, element) => {
    const tds = $(element).find("td");
    const playerName = $(tds[0]) ? $(tds[0]).text() : "playerName empty";
    const score = $(tds[1]) ? $(tds[1]).text() : "score empty";
    const duration = $(tds[2]) ? $(tds[2]).text() : "duration empty";

    if (playerName != "" || undefined)
      allServerInfo.push({
        playerName: playerName,
        score: score,
        duration: duration,
      });
  });

  allServerInfo.push(serverInfo);
  allServerInfo.push({ lastUpdate: lastUpdate });
  allServerInfo.push({ directQueryInfo: directQueryInfo });
  allServerInfo.push({ directPlayerInfo: directPlayerInfo });
  return allServerInfo;
}

module.exports = {
  name: "!server_info",
  description: "Gets server info!",
  execute(msg, args) {
    serverInfo(args)
      .then((resolve) => {
        const serverInfoObject = resolve.filter(
          (element) => element.serverName,
        );
        const lastUpdateObject = resolve.filter(
          (element) => element.lastUpdate,
        );
        const directQueryInfoArray = resolve.filter(
          (element) => element.directQueryInfo,
        );
        const directQueryInfoObject = directQueryInfoArray[0].directQueryInfo;

        const directQueryPlayerArray = resolve.filter(
          (element) => element.directPlayerInfo,
        );

        msg.channel.send(
          "*********** SERVER INFORMATION AS OF CURRENTLY ***********",
        );
        if (!directQueryInfoObject || !directQueryPlayerArray) {
          console.log("server is not online");
          msg.reply(
            args[0].charAt(0).toUpperCase() +
              args[0].slice(1) +
              " server is not online",
          );
        } else {
          console.log("server is online");
          if (directQueryInfoObject.name !== undefined) {
            msg.reply(
              args[0].charAt(0).toUpperCase() +
                args[0].slice(1) +
                " server is online",
            );
            msg.reply(
              directQueryInfoObject.name +
                " is running map " +
                directQueryInfoObject.map +
                " and has " +
                directQueryInfoObject.playersnum +
                " players with " +
                directQueryInfoObject.botsnum +
                " of those being bots",
            );
          }

          msg.channel.send(
            "*********** BELOW INFORMATION MAY NOT BE CURRENT - SEE LAST UPDATED AT ***********",
          );
          msg.channel.send("***" + lastUpdateObject[0].lastUpdate + "***");
          msg.reply(
            serverInfoObject[0].serverName +
              " has " +
              serverInfoObject[0].playerAmount +
              "players.",
          );
          serverInfoObject[0].playerAmount == 0
            ? msg.reply("There are currently no players on server")
            : msg.reply(
                resolve.map((element) => {
                  if (element.playerName != undefined)
                    return (
                      "Player " +
                      element.playerName +
                      " has " +
                      element.score +
                      " score after " +
                      element.duration
                    );
                }),
              );
        }
      })
      .catch((error) => {
        console.error("Error has occurred: ", error);
        if (error === "is not recognised") {
          msg.reply(
            args[0].charAt(0).toUpperCase() +
              args[0].slice(1) +
              " is not ours!",
          );
        }
        msg.reply(
          args[0].charAt(0).toUpperCase() +
            args[0].slice(1) +
            " is not online yet!",
        );
      });
  },
};
