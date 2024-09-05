import pool from '../../db/db.js';

const durationUtil = (duration) => {
  let query;
  switch (duration) {
    case 2016: // Weekly
      query = `
        SELECT SUM(totalTimeWeekly) as totalTime 
        FROM playerInfo;
      `;
      break;
    case 8760: // Monthly
      query = `
        SELECT SUM(totalTimeMonthly) as totalTime 
        FROM playerInfo;
      `;
      break;
    case 666: // All time
      query = `
        SELECT SUM(totalTime) as totalTime 
        FROM playerInfo;
      `;
      break;
    case 288: // Daily
      query = `
        SELECT SUM(totalTimeDaily) as totalTime 
        FROM playerInfo;
      `;
      break;
    case 999: // All columns (Daily, Weekly, Monthly, and Total)
      query = `
        SELECT SUM(totalTimeDaily) as totalTimeDaily, 
               SUM(totalTimeWeekly) as totalTimeWeekly, 
               SUM(totalTimeMonthly) as totalTimeMonthly, 
               SUM(totalTime) as totalTime 
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
          { name: 'Today', totalTime: Math.round(result.totalTimeDaily) },
          { name: 'Week', totalTime: Math.round(result.totalTimeWeekly) },
          { name: 'Month', totalTime: Math.round(result.totalTimeMonthly) },
          { name: 'All', totalTime: Math.round(result.totalTime) },
        ];
        return { duration, response };
      } else {
        const totalTime = rows[0]?.totalTime || 0;
        return { duration, totalTime };
      }
    })
    .catch((err) => {
      console.error(
        `Error fetching total time for duration ${duration}: ${err.message}`
      );
      throw err;
    });
};

export default durationUtil;
