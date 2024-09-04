import query from 'source-server-query';
import nodemailer from 'nodemailer';
import chalk from 'chalk';

const gmailPassword =
  process.env.GMAILPASSWORD ||
  (() => {
    throw new Error('Provide a gmail password in env vars');
  })();

const serverIp =
  process.env.SERVERIP ||
  (() => {
    throw new Error('Provide a server IP in env vars');
  })();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'avi312singh@gmail.com',
    pass: gmailPassword,
  },
});

const checkServerStatus = async () => {
  try {
    const directQueryInfo = await query
      .info(serverIp, 7779, 800)
      .then(query.close)
      .catch(console.error);

    const serverOfflineEmail = {
      from: 'avi312singh@gmail.com',
      to: 'avi312singh@gmail.com',
      subject: 'FTYD is offline',
      text: 'The server has gone offline! ' + directQueryInfo,
    };

    if (directQueryInfo instanceof Error) {
      return transporter.sendMail(serverOfflineEmail, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Server is offline!');
          console.log(
            'Email sent: ' +
              info.response +
              ' and this was returned from the server fetch request: ' +
              directQueryInfo
          );
        }
      });
    } else {
      console.log('Server is online!');
    }
  } catch (error) {
    console.error(
      chalk.red(
        'Error occurred whilst sending a request to the server regarding its status with error: ' +
          error
      )
    );
  }
};

export default checkServerStatus;
