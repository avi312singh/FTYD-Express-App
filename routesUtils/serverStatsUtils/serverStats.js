import chalk from 'chalk';
import query from 'source-server-query';
import utf8 from 'utf8';

import dotenv from 'dotenv';
dotenv.config();

function directPlayerInfoUtf8Encoded(arrayToBeUtf8d) {
  if (!Array.isArray(arrayToBeUtf8d)) {
    return []; // Return an empty array if input is not an array
  }

  for (let i = 0; i < arrayToBeUtf8d.length; i++) {
    arrayToBeUtf8d[i].name = utf8.decode(arrayToBeUtf8d[i].name);
    delete arrayToBeUtf8d[i].index;
  }
  return arrayToBeUtf8d;
}

const serverStatsUtil = async (currentMapName, currentServerName, serverIp) => {
  let allServerInfo = [];
  try {
    let directQueryInfo = await query
      .info(serverIp, 7779, 8000)
      .then(query.close)
      .catch(console.error);
    let directPlayerInfo = await query
      .players(serverIp, 7779, 8000)
      .then(query.close)
      .catch(console.error);

    if (directQueryInfo instanceof Error || !directQueryInfo) {
      directQueryInfo = {
        status: 'offline',
        playersnum: 0,
      };
    } else {
      directQueryInfo.status = 'online';
    }

    allServerInfo.push({ directQueryInfo });
    allServerInfo.push({
      directPlayerInfo: directPlayerInfoUtf8Encoded(directPlayerInfo),
    });
    return allServerInfo;
  } catch (error) {
    console.error(
      chalk.red(
        'Sending default response as error has occurred whilst fetching a set of new players with error: ' +
          error
      )
    );

    allServerInfo.push({
      directQueryInfo: {
        name: currentServerName,
        map: currentMapName,
        folder: 'chivalrymedievalwarfare',
        game: 'Chivalry: Medieval Warfare',
        appid: 0,
        playersnum: 0,
        maxplayers: 64,
        botsnum: 0,
        status: 'offline',
      },
    });
    allServerInfo.push({ directPlayerInfo: [] });
    return allServerInfo;
  }
};

export default serverStatsUtil;
