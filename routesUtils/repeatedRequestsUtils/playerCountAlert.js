import query from 'source-server-query';
import nodemailer from 'nodemailer';
import chalk from 'chalk';

const gmailPassword =
  process.env.GMAILPASSWORD ||
  (() => {
    throw new Error('Provide a Gmail password in env vars');
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

const playerCountAlert = async () => {
  try {
    const directQueryInfo = await query
      .info(serverIp, 7779, 8000)
      .then(query.close)
      .catch(console.error);

    if (directQueryInfo instanceof Error) {
      return;
    }

    if (directQueryInfo.playersnum > 20) {
      const playerCountEmail = {
        from: 'avi312singh@gmail.com',
        to: 'avi312singh@gmail.com',
        subject: `FTYD player count: ${directQueryInfo.playersnum}`,
        text: `The player count has gone above 20! ${directQueryInfo}`,
      };

      transporter.sendMail(playerCountEmail, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Player count alert sent successfully!', info.response);
        }
      });
    }
  } catch (error) {
    console.error(
      chalk.red(`Error occurred while fetching player count: ${error}`)
    );
  }
};

export default playerCountAlert;
