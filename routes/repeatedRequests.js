import express from 'express';
const router = express.Router();
import axios from 'axios';
import chalk from 'chalk';
import cron from 'node-cron';
import schedule from 'node-schedule';
import moment from 'moment';
import winston from 'winston';
import _ from 'underscore';

import resetDailyUtil from '../routesUtils/serverStatsUtils/resetDaily.js';
import resetWeeklyUtil from '../routesUtils/serverStatsUtils/resetWeekly.js';
import resetMonthlyUtil from '../routesUtils/serverStatsUtils/resetMonthly.js';
import serverInfoUtil from '../routesUtils/serverStatsUtils/serverInfo.js';
import serverStatsUtil from '../routesUtils/serverStatsUtils/serverStats.js';
import temporaryDataUtil from '../routesUtils/serverStatsUtils/temporaryData.js';
import imageSrcUtil from '../routesUtils/serverStatsUtils/imageSrc.js';
import truncate from '../routesUtils/repeatedRequestsUtils/truncate.js';
import topPlayers from '../routesUtils/aggregatedStatsUtils/topPlayers.js';
import allRows from '../routesUtils/dbInteractionsUtils/allRows.js';
import steamRequest from '../routesUtils/repeatedRequestsUtils/steamRequest.js';
import steamSessionRequest from '../routesUtils/repeatedRequestsUtils/steamSessionIdRequest.js';
import serverStatus from '../routesUtils/repeatedRequestsUtils/serverStatus.js';
import playerCountAlert from '../routesUtils/repeatedRequestsUtils/playerCountAlert.js';

import pool from '../db/db.js';

const serverIp =
  process.env.SERVERIP ||
  (() => {
    new Error('Provide a server IP in env vars');
  });
const endpoint =
  process.env.APIENDPOINT ||
  (() => {
    new Error('Provide a api endpoint in env vars');
  });

const recognisedTemporaryTableNames = [
  'playersComparisonFirst',
  'playersComparisonSecond',
];
let running = false;

const keyword = (keyword) => chalk.hex('blue')(keyword);

const getNewPlayers = async () => {
  const currentMapName = 'aocffa-ftyd_5_6_4';
  const currentServerName = '*** falltoyourdeathserver.com FTYD 24/7 ***';
  return await serverStatsUtil(
    currentMapName,
    currentServerName,
    serverIp
  ).catch((error) => console.log(chalk.red(error)));
};

const dir = './logging/';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
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

const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
router.get('/', async (req, res) => {
  if (!running) {
    running = true;

    console.log('GET: repeatedRequests ' + timestamp);
    res.status(200).json({
      message: 'Initiating repeated requests ',
      timestamp,
    });
    console.log('Cleaning tables');
    truncate();

    // Start running all scheduled tasks

    // sends player count every 5 mins to serverInfo table
    cron.schedule('*/5 * * * *', async () => {
      const serverInfo = await getNewPlayers()
        .then((eachObject) =>
          eachObject
            .map((element) => element.directQueryInfo)
            .filter((el) => el != null)
        )
        .catch((result) => {
          console.log(chalk.red(result));
        });

      serverInfoUtil(
        serverInfo[0].playersnum,
        serverInfo[0].botsnum,
        serverInfo[0].name,
        serverInfo[0].map
      )
        .then((result) => {
          console.log(
            chalk.blue(
              'Database entry ' +
                chalk.whiteBright.underline(
                  keyword('serverInfo') +
                    ' added/updated for serverInfo endpoint!'
                )
            )
          );
          console.log({
            playerCount: result.playerCount,
            botCount: result.botCount,
            serverName: result.serverName,
            mapName: result.mapName,
          });
        })
        .catch((result) => {
          console.log(chalk.red(result));
        });
    });

    // sends query every 2 minutes to server to check if online if not then send email
    cron.schedule('*/2 * * * *', async () => {
      await serverStatus().then(
        console.log(
          chalk.blue(
            'I WAS TRIGGERED ON LINE 100 in repeated requests AT ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              'Sent query to see if server is online or offline '
          )
        )
      );
    });

    // sends query every 5 minutes to server to check if player count exceeds amount
    cron.schedule('*/5 * * * *', async () => {
      await playerCountAlert().then(
        console.log(
          chalk.blue(
            'I WAS TRIGGERED ON LINE 105 in repeated requests AT ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              'Sent query to see if server player count has gone above 20 '
          )
        )
      );
    });

    // sends query to set all daily columns to 0 at 00:01 everyday
    cron.schedule('01 00 * * *', async () => {
      resetDailyUtil().then(
        console.log(
          chalk.blue(
            'I WAS TRIGGERED ON LINE 86 in repeated requests AT ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              'Reset totalKillsDaily, totalPointsSpentDaily, totalTimeDaily to ' +
              chalk.whiteBright.underline(keyword('0'))
          )
        )
      );
    });

    // sends query to set all weekly columns to 0 at 00:01 every Monday
    cron.schedule('01 00 * * 1', async () => {
      resetWeeklyUtil().then(
        console.log(
          chalk.blue(
            'I WAS TRIGGERED ON LINE 92 in repeated requests AT ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              'Reset totalKillsWeekly, totalPointsSpentWeekly, totalTimeWeekly to ' +
              chalk.whiteBright.underline(keyword('0'))
          )
        )
      );
    });

    // sends query to set all daily columns to 0 at 00:01 every 1st
    cron.schedule('01 00 1 * *', async () => {
      resetMonthlyUtil().then(
        console.log(
          chalk.blue(
            'I WAS TRIGGERED ON LINE 98 in repeated requests AT ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              'Reset totalKillsWeekly, totalPointsSpentWeekly, totalTimeWeekly to ' +
              chalk.whiteBright.underline(keyword('0'))
          )
        )
      );
    });

    // sends query to steam to get all imageSrc of top players every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log(
        'Sending query to steam to get all imageSrc of top players every 6th hour'
      );
      const topPlayersRequest = await topPlayers('', pool);
      const topPlayersResponse = topPlayersRequest.response;
      const flattenedTopPlayers = [].concat.apply([], topPlayersResponse);
      for (var i = 0; i < flattenedTopPlayers.length; i += 5) {
        try {
          let sessionId;
          console.log('current player: ', flattenedTopPlayers[i]);
          sessionId = await steamSessionRequest();
          console.log('sessionId: ', sessionId);
          const imageSrc = await steamRequest(
            sessionId,
            flattenedTopPlayers[i]
          );
          return await imageSrcUtil(
            encodeURIComponent(flattenedTopPlayers[i]),
            imageSrc
          );
        } catch (error) {
          console.log(
            'Error has occurred during steam requests for avatar picture for top players started at ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              ': ' +
              error
          );
          continue;
        }
      }
    });

    //TODO: THIS NEEDS TO BE MOVED TO ITS OWN ROUTE AS IT KILLS MEMORY

    // sends query to steam to get all imageSrc of all players at 00:00 every Sunday
    cron.schedule('0 0 * * sun', async () => {
      console.log(
        'Sending query to steam to get all imageSrc of top players every sunday 00:00'
      );
      const allRowsRequest = await allRows('playerInfo', 'playerInfo');
      const allRowsResponse = allRowsRequest.rows;
      for (var i = 0; i < allRowsResponse.length; i++) {
        try {
          let sessionId;
          console.log('current player: ', allRowsResponse[i].playerName);
          console.log('imageSrc:  ', allRowsResponse[i].imageSrc);
          if (
            allRowsResponse[i].imageSrc == false ||
            allRowsResponse[i].imageSrc == null
          ) {
            sessionId = await steamSessionRequest();
            console.log('sessionId: ', sessionId);
            const imageSrc = await steamRequest(
              sessionId,
              allRowsResponse[i].playerName
            );
            return await imageSrcUtil(
              encodeURIComponent(allRowsResponse[i].playerName),
              imageSrc
            );
          } else {
            console.log(
              allRowsResponse[i].playerName,
              ' already has a player image URL so skipping'
            );
            continue;
          }
        } catch (error) {
          console.log(
            'Error has occurred during steam requests for avatar picture for all players started at ' +
              moment().format('YYYY-MM-DD HH:mm:ss') +
              ': ' +
              error
          );
          continue;
        }
      }
    });

    // cron to manually check who is online or not
    cron.schedule('*/15 * * * * *', async () => {
      console.log(
        'Checking online players at',
        moment().format('YYYY-MM-DD HH:mm:ss')
      );

      try {
        // Fetch currently online players from the server
        const serverPlayers = await getNewPlayers(); // Assuming getNewPlayers returns online players

        const onlinePlayers = serverPlayers.map((player) => player.name);

        // Update `online` status in the database
        const updateOnlineStatusQuery = `
          UPDATE playerInfo 
          SET online = CASE 
            WHEN playerName IN (?) THEN 1 
            ELSE 0 
          END
        `;

        await pool.execute(updateOnlineStatusQuery, [onlinePlayers]);

        console.log('Successfully updated online status for players');
      } catch (error) {
        console.error('Error updating online status:', error.message);
      }
    });

    // initial request of players every 15 seconds to playersComparisonCache table
    const firstJob = schedule.scheduleJob(
      { rule: '*/15 * * * * *' },
      async (fireDate) => {
        const serverInfoUnfiltered = await getNewPlayers();

        const serverInfo = serverInfoUnfiltered
          .map((element) => element.directQueryInfo)
          .filter((el) => el != null);

        if (!serverInfo[0].name) {
          console.log(
            chalk.magentaBright('Server not online! Waiting for 1 minute')
          );
          firstJob.cancel(true);
          secondJob.cancel(true);
        }

        console.log(
          chalk
            .hex('#DEADED')
            .bold(
              'running first task ************************************************************************************************************************************************************'
            )
        );
        console.log(
          'First starting now: ' +
            moment().format('ss') +
            ' but really started at ' +
            fireDate
        );

        const playerInfoToBeCompared = await getNewPlayers()
          .then((eachObject) =>
            eachObject
              .map((element) => element.directPlayerInfo)
              .filter((el) => el != null)
          )
          .catch((result) => {
            console.log(chalk.red(result));
          });

        const playersInfoUnfiltered =
          playerInfoToBeCompared[0] !== null &&
          playerInfoToBeCompared[0] instanceof Array
            ? playerInfoToBeCompared[0].map((element) => element)
            : undefined;

        if (!playersInfoUnfiltered) {
          console.error(
            chalk.red(
              '************* Server is not online so waiting for 30 seconds before next request to server'
            )
          );
          firstJob.cancel(true);
          secondJob.cancel(true);
        }

        const playersInfo = playersInfoUnfiltered
          ? playersInfoUnfiltered.filter((el) => el.name !== '' || undefined)
          : firstJob.cancel(true);

        if (playersInfo.length == 0 || serverInfo[0].playersnum == 0) {
          console.log(
            chalk.green('No one is on the server yet! New Players: ') +
              JSON.stringify(playersInfo, null, 4)
          );
          console.log(chalk.green('Cancelling current jobs '));
          // TODO: Wait or not
          firstJob.cancel(true);
          secondJob.cancel(true);
        }

        for (let i = 0; i < playersInfo.length; i++) {
          if (!playersInfo[i] || !playersInfo[i].name) {
            console.error('PlayersInfo at index ' + [i] + ' has been skipped');
          } else {
            try {
              const result = await temporaryDataUtil(
                encodeURIComponent(playersInfo[i].name),
                playersInfo[i].duration,
                playersInfo[i].score,
                'playersComparisonFirst',
                recognisedTemporaryTableNames
              );
              console.log(
                chalk.blue(
                  'Database entry ' +
                    chalk.whiteBright.underline(keyword(result.name)) +
                    ' with duration ' +
                    chalk.whiteBright.underline(keyword(result.time)) +
                    ' and score ' +
                    chalk.whiteBright.underline(keyword(result.score)) +
                    ' added into ' +
                    result.tableName
                )
              );
            } catch (error) {
              console.error('Error during data insertion:', error.message);
            }
          }
        }

        const completedNow = moment().format('HH:mm:ss');
        console.log(
          chalk.blue(
            'Completed first job at Time: ',
            chalk.blueBright(completedNow)
          )
        );
      }
    );

    const secondJob = schedule.scheduleJob(
      { rule: '14-59/15 * * * * *' },
      async (fireDate) => {
        console.log(
          chalk
            .hex('#DEADED')
            .bold(
              'running second task ************************************************************************************************************************************************************'
            )
        );
        console.log(
          'Second starting now: ' +
            moment().format('ss') +
            ' but really started at ' +
            fireDate
        );

        const playersInfoToBeCompared = await getNewPlayers().then(
          (eachObject) =>
            eachObject
              .map((element) => element.directPlayerInfo)
              .filter((el) => el != null)
        );

        const serverInfoUnfiltered = await getNewPlayers();
        const serverInfo = serverInfoUnfiltered
          .map((element) => element.directQueryInfo)
          .filter((el) => el != null);

        const playersInfoUnfiltered =
          playersInfoToBeCompared[0] !== null &&
          playersInfoToBeCompared[0] instanceof Array
            ? playersInfoToBeCompared[0].map((element) => element)
            : undefined;

        if (!playersInfoUnfiltered) {
          console.error(
            chalk.red(
              '************* Server is not online so waiting for 30 seconds before next request to server'
            )
          );
          firstJob.cancel(true);
          secondJob.cancel(true);
        }

        const playersInfo = playersInfoUnfiltered
          ? playersInfoUnfiltered.filter((el) => el.name !== '' || undefined)
          : secondJob.cancel(true);

        for (let i = 0; i < playersInfo.length; i++) {
          try {
            const result = await temporaryDataUtil(
              encodeURIComponent(playersInfo[i].name),
              playersInfo[i].duration,
              playersInfo[i].score,
              'playersComparisonSecond',
              recognisedTemporaryTableNames
            );
            console.log(
              chalk.blue(
                'Database entry ' +
                  chalk.whiteBright.underline(keyword(result.name)) +
                  ' with duration ' +
                  chalk.whiteBright.underline(keyword(result.time)) +
                  ' and score ' +
                  chalk.whiteBright.underline(keyword(result.score)) +
                  ' added into ' +
                  result.tableName
              )
            );
          } catch (error) {
            console.error('Error during data insertion:', error.message);
          }
        }

        // Now that we have sent both players to the database - compare them both
        console.log('********* START COMPARISON ***************');

        const [oldPlayersRows] = await pool.execute(
          'SELECT name, time, score FROM playersComparisonFirst'
        );
        const oldPlayers = oldPlayersRows.filter((el) => el.name !== '');

        const [newPlayersRows] = await pool.execute(
          'SELECT name, time, score FROM playersComparisonSecond'
        );
        const newPlayers = newPlayersRows.filter((el) => el.name !== '');

        console.log('New Players:', newPlayers);
        console.log('Old Players:', oldPlayers);

        // Compare both arrays with each other and see which elements don't exist in other one
        let postRequests = [];
        // They have left and remove from oldPlayers array
        if (
          !Array.isArray(oldPlayers) ||
          !oldPlayers.length == 0 ||
          serverInfo[0].playersnum >= 0
        ) {
          var z = oldPlayers.length;
          while (z--) {
            const playerHasLeft =
              _.findIndex(newPlayers, { name: oldPlayers[z].name }) === -1
                ? true
                : false;
            if (playerHasLeft) {
              console.log(oldPlayers[z].name + ' has abandoned the battle');
              const lastLoginQuery = `
                UPDATE playerInfo
                SET lastLogin = NOW(), online = 0
                WHERE playerName = ?
              `;
              await pool
                .execute(lastLoginQuery, [oldPlayers[z].name])
                .then(([rows]) => {
                  console.log(
                    `Successfully updated lastLogin for player: ${oldPlayers[z].name}`
                  );
                })
                .catch((error) => {
                  console.error(
                    `Failed to update lastLogin for player: ${oldPlayers[z].name}, Error: ${error.message}`
                  );
                });
              // remove from array
              const index = oldPlayers.indexOf(oldPlayers[z].name);
              if (index > -1) {
                oldPlayers.splice(index, 1);
              }
            }
          }
        }

        // They have joined and remove from newPlayers array
        if (
          !Array.isArray(newPlayers) ||
          !newPlayers.length == 0 ||
          serverInfo[0].playersnum >= 0
        ) {
          var y = newPlayers.length;
          while (y--) {
            const playerHasJoined =
              _.findIndex(oldPlayers, { name: newPlayers[y].name }) === -1
                ? true
                : false;
            if (playerHasJoined) {
              console.log(newPlayers[y].name, ' has joined the server');
              const insertPlayerQuery = `
              INSERT INTO playerInfo (playerName, online) 
              VALUES (?, 1) 
              ON DUPLICATE KEY UPDATE 
                totalTime = totalTime + 0.25, 
                totalTimeDaily = totalTimeDaily + 0.25, 
                totalTimeWeekly = totalTimeWeekly + 0.25, 
                totalTimeMonthly = totalTimeMonthly + 0.25
              `;
              await pool
                .execute(insertPlayerQuery, [newPlayers[y].name])
                .then(([rows]) => {
                  console.log(
                    `Successfully added/updated player: ${newPlayers[y].name} (new player)`
                  );
                })
                .catch((error) => {
                  console.error(
                    `Failed to add/update player: ${newPlayers[y].name} (new player), Error: ${error.message}`
                  );
                });

              // remove from array
              const findIndex = _.findIndex(newPlayers, {
                name: newPlayers[y].name,
              });

              if (findIndex > -1) {
                newPlayers.splice(findIndex, 1);
              }
            }
          }
        }

        for (let i = 0; i < newPlayers.length; i++) {
          let scoreDifference = 0;
          let newPlayerIndex;
          let oldPlayerIndex;
          newPlayerIndex =
            _.findIndex(newPlayers, { name: oldPlayers[i].name }) != -1
              ? _.findIndex(newPlayers, { name: oldPlayers[i].name })
              : _.findIndex(newPlayers, { name: newPlayers[i].name });
          oldPlayerIndex =
            _.findIndex(oldPlayers, { name: newPlayers[i].name }) != -1
              ? _.findIndex(oldPlayers, { name: newPlayers[i].name })
              : _.findIndex(oldPlayers, { name: oldPlayers[i].name });

          if (
            newPlayers[newPlayerIndex].score != oldPlayers[oldPlayerIndex].score
          ) {
            if (
              newPlayers[newPlayerIndex].score <
              oldPlayers[oldPlayerIndex].score
            ) {
              scoreDifference =
                oldPlayers[oldPlayerIndex].score -
                newPlayers[newPlayerIndex].score;
              logger.log({
                level: 'info',
                message: `${
                  newPlayers[newPlayerIndex].name +
                  "'s score is less than the old one as ******** new score is " +
                  newPlayers[newPlayerIndex].score +
                  ' and old score is ' +
                  oldPlayers[oldPlayerIndex].score +
                  ' with difference ' +
                  scoreDifference
                }`,
              });
              const pointsSpentQuery = `
              UPDATE playerInfo
              SET totalPointsSpent = totalPointsSpent + ?, totalPointsSpentDaily = totalPointsSpentDaily + ?, totalPointsSpentWeekly = totalPointsSpentWeekly + ?, totalPointsSpentMonthly = totalPointsSpentMonthly + ?
              WHERE playerName = ?
            `;

              const pointsSpentRequest = pool
                .execute(pointsSpentQuery, [
                  scoreDifference,
                  scoreDifference,
                  scoreDifference,
                  scoreDifference,
                  newPlayers[newPlayerIndex].name,
                ])
                .then(([rows]) => {
                  console.log(
                    `Successfully updated pointsSpent for player: ${newPlayers[newPlayerIndex].name}`
                  );
                })
                .catch((error) => {
                  console.error(
                    `Failed to update pointsSpent for player: ${newPlayers[newPlayerIndex].name}, Error: ${error.message}`
                  );
                });
            } else if (
              newPlayers[newPlayerIndex].score >
              oldPlayers[oldPlayerIndex].score
            ) {
              scoreDifference =
                newPlayers[newPlayerIndex].score -
                oldPlayers[oldPlayerIndex].score;
              logger.log({
                level: 'info',
                message: `${
                  newPlayers[newPlayerIndex].name +
                  "'s score is more than the old one as ******** new score is " +
                  newPlayers[newPlayerIndex].score +
                  ' and old score is ' +
                  oldPlayers[oldPlayerIndex].score +
                  ' with difference ' +
                  scoreDifference
                }`,
              });
              const killsQuery = `
              UPDATE playerInfo
              SET totalKills = totalKills + ?, totalKillsDaily = totalKillsDaily + ?, totalKillsWeekly = totalKillsWeekly + ?, totalKillsMonthly = totalKillsMonthly + ?
              WHERE playerName = ?
            `;

              const killsRequest = pool
                .execute(killsQuery, [
                  scoreDifference / 2,
                  scoreDifference / 2,
                  scoreDifference / 2,
                  scoreDifference / 2,
                  newPlayers[newPlayerIndex].name,
                ])
                .then(([rows]) => {
                  console.log(
                    `Successfully updated kills for player: ${newPlayers[newPlayerIndex].name}`
                  );
                })
                .catch((error) => {
                  console.error(
                    `Failed to update kills for player: ${newPlayers[newPlayerIndex].name}, Error: ${error.message}`
                  );
                });
            }
          } else {
            logger.log({
              level: 'info',
              message: `${
                newPlayers[newPlayerIndex].name +
                "'s score hasn't changed ******** because new score is " +
                newPlayers[newPlayerIndex].score +
                ' and old score is ' +
                oldPlayers[oldPlayerIndex].score
              }`,
            });
            const updateTimeQuery = `
  UPDATE playerInfo
  SET totalTime = totalTime + 0.25, totalTimeDaily = totalTimeDaily + 0.25, totalTimeWeekly = totalTimeWeekly + 0.25, totalTimeMonthly = totalTimeMonthly + 0.25
  WHERE playerName = ?
`;

            const updateTimeRequest = pool
              .execute(updateTimeQuery, [newPlayers[newPlayerIndex].name])
              .then(([rows]) => {
                console.log(
                  `Successfully updated time for player: ${newPlayers[newPlayerIndex].name}`
                );
              })
              .catch((error) => {
                console.error(
                  `Failed to update time for player: ${newPlayers[newPlayerIndex].name}, Error: ${error.message}`
                );
              });
          }
        }

        // Send all endpoint requests from above
        Promise.all(postRequests)
          .then(
            console.log(chalk.whiteBright('Sent remaining players to database'))
          )
          .catch(console.error);

        //  Need to truncate temp tables playersComparisonFirst and playersComparisonSecond
        truncate();
        const completedNow = moment().format('HH:mm:ss');
        console.log(
          chalk.blue(
            'Completed second job at Time: ',
            chalk.blueBright(completedNow)
          )
        );
      }
    );

    // Do not do the first scheduled run of secondJob as firstJob needs to be in front with a 15 second offset
    secondJob.cancelNext(true);
  } else {
    console.log(
      'repeatedRequests is already running and was called at: ' + timestamp
    );
    return res.status(404).json({
      error: {
        message:
          'This endpoint has already been called and was called at: ' +
          timestamp,
      },
    });
  }
});

export default router;
