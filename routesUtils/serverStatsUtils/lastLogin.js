const moment = require('moment');

module.exports =
    (encodedNameToBeStored, pool) => {
        const timestampForLastLogin = moment().format('YYYY-MM-DD HH:mm:ss').toString();
        return new Promise((resolve, reject) => {
            try {
                if (encodedNameToBeStored) {
                    pool.getConnection((err, connection) => {
                        const name = decodeURIComponent(encodedNameToBeStored);
                        if (err) console.log(err);
                        connection.query(`INSERT INTO playerInfo (playerName, online) VALUES (?, false) ON DUPLICATE KEY UPDATE totalTime = totalTime + .25, totalTimeDaily = totalTimeDaily + .25, lastLogin = '${timestampForLastLogin}'`
                        , [name], (err, result) => {
                            connection.release();
                            return err ? reject(err) : resolve({
                                name: name, lastLogin: timestampForLastLogin, online: false
                                // , result: result
                            });
                        });
                    });
                }
                else reject('Name is empty in query params');
            }
            catch (error) {
                return reject(error)
            }
        })
    }
