import query from 'source-server-query';
import nodemailer from 'nodemailer';
import chalk from 'chalk'; // Assuming chalk is being used

const gmailPassword = process.env.GMAILPASSWORD;
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

const sendPlayerCountEmail = async () => {
  try {
    const directQueryInfo = await query
      .info(serverIp, 7779, 800)
      .then(query.close)
      .catch(console.error);

    if (
      !(directQueryInfo instanceof Error) &&
      directQueryInfo.playersnum > 20
    ) {
      const playerCountEmail = {
        from: 'avi312singh@gmail.com',
        to: 'avi312singh@gmail.com',
        subject: 'FTYD player count: ' + directQueryInfo.playersnum,
        text:
          'The player count has gone above 20! ' +
          JSON.stringify(directQueryInfo),
      };

      return transporter.sendMail(playerCountEmail, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Server is online!');
          console.log(
            'Email sent: ' +
              info.response +
              ' and this was returned from the server fetch request: ' +
              JSON.stringify(directQueryInfo)
          );
        }
      });
    } else {
      console.log('Player count is below threshold or an error occurred.');
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

export default sendPlayerCountEmail;
