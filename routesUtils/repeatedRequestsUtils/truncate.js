import pool from '../../db/db.js';

const truncate = () => {
  pool.getConnection((err, connection) => {
    if (err) console.log(err);
    connection.query(
      `TRUNCATE playersComparisonFirst;`,
      (err, result, fields) => {
        if (err) console.log(err);
        if (result) {
          console.log('Reset all rows in playersComparisonFirst table');
        }
        if (fields) console.log(fields);
      }
    );
    connection.query(
      `TRUNCATE playersComparisonSecond;`,
      (err, result, fields) => {
        if (err) console.log(err);
        if (result) {
          console.log('Reset all rows in playersComparisonSecond table');
        }
        if (fields) console.log(fields);
        connection.release();
      }
    );
  });
};

export default truncate;
