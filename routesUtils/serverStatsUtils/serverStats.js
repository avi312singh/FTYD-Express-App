import query from 'source-server-query';
import utf8 from 'utf8';
import chalk from 'chalk';
import winston from 'winston';

// Set up logging
const dir = './logging/';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'server-stats-service' },
  transports: [
    new winston.transports.File({
      filename: `${dir}logging.log`,
      level: 'info',
      maxsize: 7000,
    }),
    new winston.transports.File({
      filename: `${dir}error.log`,
      level: 'error',
    }),
  ],
});

function directPlayerInfoUtf8Encoded(players) {
  return players.map((player) => ({
    name: utf8.decode(player.name),
    // Remove index if it's present
    ...Object.fromEntries(
      Object.entries(player).filter(([key]) => key !== 'index')
    ),
  }));
}

const serverStatsUtil = async (currentMapName, currentServerName, serverIp) => {
  let allServerInfo = [];

  try {
    const directQueryInfo = await query
      .info(serverIp, 7779, 8000)
      .catch((error) => {
        logger.error(`Error fetching server info: ${error.message}`);
        console.error(
          chalk.red(`Error fetching server info: ${error.message}`)
        );
        return null;
      });

    const directPlayerInfo = await query
      .players(serverIp, 7779, 8000)
      .catch((error) => {
        logger.error(`Error fetching player info: ${error.message}`);
        console.error(
          chalk.red(`Error fetching player info: ${error.message}`)
        );
        return [];
      });

    // Handling the case when the server info query fails
    if (!directQueryInfo) {
      logger.warn(`Server seems offline for IP: ${serverIp}`);
      allServerInfo.push({
        directQueryInfo: {
          status: 'offline',
          playersnum: 0,
        },
      });
    } else {
      directQueryInfo.status = 'online';
      allServerInfo.push({ directQueryInfo });
    }

    allServerInfo.push({
      directPlayerInfo: directPlayerInfoUtf8Encoded(directPlayerInfo),
    });

    return allServerInfo;
  } catch (error) {
    // Log and return default response if something goes wrong
    logger.error(`Error fetching server stats: ${error.message}`);
    console.error(
      chalk.red(
        `Sending default response as an error occurred whilst fetching new players: ${error.message}`
      )
    );

    // Default fallback response when an error occurs
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
