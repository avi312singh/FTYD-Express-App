import pool from '../../db/db.js';

const topPlayersUtil = (duration) => {
  const query = `
    SELECT playerName, totalKillsWeekly AS totalKills, totalTimeWeekly AS totalTime, 
           ROUND(totalKillsWeekly / totalTimeWeekly, 2) AS killsPerTimeSpentRatio, imageSrc 
    FROM playerInfo 
    WHERE totalKillsWeekly != 0 
    ORDER BY totalKillsWeekly DESC 
    LIMIT 10;
  `;

  return pool
    .execute(query, [])
    .then(([rows]) => ({
      duration,
      topPlayers: rows,
    }))
    .catch((err) => {
      console.error(
        `Error fetching top players for duration ${duration}: ${err.message}`
      );
      throw err;
    });
};

export default topPlayersUtil;
