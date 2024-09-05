import pool from '../../db/db.js';

const pageCountUtil = (pageFromRequest) => {
  return new Promise((resolve, reject) => {
    try {
      // List of recognized pages
      const recognizedPages = [
        '/',
        'donate',
        'server-info',
        'player-stats',
        'server-data',
        'top-players',
      ];

      // Check if the page is recognized
      if (!pageFromRequest || !recognizedPages.includes(pageFromRequest)) {
        return reject('Not a valid page');
      }

      const page = pageFromRequest.toString();

      // Execute the query to get the page count
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('Connection error:', err);
          return reject(err);
        }

        connection.query(
          `SELECT * FROM pageCount WHERE page = ?`,
          [page],
          (err, result) => {
            if (err) {
              console.error('Query error:', err);
              return reject(err);
            }

            resolve({ result });
          }
        );

        connection.release();
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      reject('Error has occurred ', error);
    }
  });
};

export default pageCountUtil;
