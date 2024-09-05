import pool from '../../db/db.js';

const pageCountPutUtil = (page) => {
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
  if (!recognizedPages.includes(page)) {
    return Promise.reject('Not a valid page');
  }

  const query = `
    UPDATE pageCount SET hits = hits + 1, lastHit = NOW() 
    WHERE page = ?;
  `;

  return pool
    .execute(query, [page])
    .then(() => ({ page }))
    .catch((err) => {
      console.error(`Error updating page count for ${page}: ${err.message}`);
      throw err;
    });
};

export default pageCountPutUtil;
