import pool from '../../db/db.js';

const temporaryDataUtil = (
  name,
  time,
  score,
  tableName,
  recognisedTemporaryTableNames
) => {
  return new Promise((resolve, reject) => {
    try {
      if (!recognisedTemporaryTableNames.includes(tableName)) {
        return reject(`Table name '${tableName}' is not recognised.`);
      }

      pool.getConnection((err, connection) => {
        if (err) console.log(err);
        connection.query(
          `INSERT INTO ${tableName} (name, time, score) VALUES (?, ?, ?)`,
          [name, time, score],
          (err, result) => {
            connection.release();
            return err
              ? reject(err)
              : resolve({ name, time, score, tableName });
          }
        );
      });
    } catch (error) {
      return reject(error);
    }
  });
};

export default temporaryDataUtil;
