import pool from '../../db/db.js';

const allRowsUtil = async (tableName, recognisedTableNames) => {
  // Validate the table name against recognised table names
  if (!recognisedTableNames.includes(tableName)) {
    throw new Error(`Table name '${tableName}' is not recognised.`);
  }

  try {
    // Use backticks to ensure the table name is properly escaped
    const query = `SELECT * FROM \`${tableName}\``;
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error(`Error fetching data from '${tableName}': ${error.message}`);
    throw new Error(`Failed to fetch data from ${tableName}.`);
  }
};

export default allRowsUtil;
