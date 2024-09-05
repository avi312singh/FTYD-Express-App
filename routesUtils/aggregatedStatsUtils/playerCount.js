import pool from '../../db/db.js';

const playerCountUtil = (duration) => {
  let query;

  switch (duration) {
    case 2016: // Weekly duration
    case 8760: // Monthly duration
      query = `
        SELECT time, playerCount
        FROM (
          SELECT @row := @row +1 AS rownum, time, playerCount
          FROM (
            SELECT @row := 0) r, serverInfo 
          ORDER BY time DESC 
          LIMIT ?
        ) ranked
        WHERE rownum % 4 = 1
        ORDER BY time;
      `;
      break;

    case 288: // Daily duration
      query = `
        SELECT time, playerCount
        FROM (
          SELECT time, playerCount 
          FROM serverInfo 
          ORDER BY time DESC 
          LIMIT 288
        ) a
        ORDER BY time;
      `;
      break;

    default:
      return Promise.reject('Invalid duration parameter');
  }

  return pool
    .execute(query, [duration])
    .then(([rows]) => ({
      duration,
      response: rows,
    }))
    .catch((err) => {
      console.error(
        `Error fetching player count for duration ${duration}: ${err.message}`
      );
      throw err;
    });
};

export default playerCountUtil;
