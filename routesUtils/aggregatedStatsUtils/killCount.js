import pool from '../../db/db.js';

const killCountUtil = (duration) => {
  let query;
  switch (duration) {
    case 2016: // Weekly
      query = `
        SELECT SUM(totalKillsWeekly) as totalKills 
        FROM playerInfo;
      `;
      break;
    case 8760: // Monthly
      query = `
        SELECT SUM(totalKillsMonthly) as totalKills 
        FROM playerInfo;
      `;
      break;
    case 666: // All time
      query = `
        SELECT SUM(totalKills) as totalKills 
        FROM playerInfo;
      `;
      break;
    case 288: // Daily
      query = `
        SELECT SUM(totalKillsDaily) as totalKills 
        FROM playerInfo;
      `;
      break;
    case 999: // All columns (Daily, Weekly, Monthly, and Total)
      query = `
        SELECT SUM(totalKillsDaily) as totalKillsDaily, 
               SUM(totalKillsWeekly) as totalKillsWeekly, 
               SUM(totalKillsMonthly) as totalKillsMonthly, 
               SUM(totalKills) as totalKills 
        FROM playerInfo;
      `;
      break;
    default:
      return Promise.reject('Invalid duration parameter');
  }

  return pool
    .execute(query)
    .then(([rows]) => {
      if (duration === 999) {
        const [result] = rows;
        const response = [
          { name: 'Today', totalKills: result.totalKillsDaily },
          { name: 'Week', totalKills: result.totalKillsWeekly },
          { name: 'Month', totalKills: result.totalKillsMonthly },
          { name: 'All', totalKills: result.totalKills },
        ];
        return { duration, response };
      } else {
        const totalKills = rows[0]?.totalKills || 0;
        return { duration, totalKills };
      }
    })
    .catch((err) => {
      console.error(
        `Error fetching total kills for duration ${duration}: ${err.message}`
      );
      throw err;
    });
};

export default killCountUtil;
