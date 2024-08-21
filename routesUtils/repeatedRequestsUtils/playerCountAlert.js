const query = require("source-server-query");
const nodemailer = require("nodemailer");

const gmailPassword =
  process.env.GMAILPASSWORD ||
  (() => {
    new Error("Provide a gmail password in env vars");
  });
const serverIp =
  process.env.SERVERIP ||
  (() => {
    new Error("Provide a server IP in env vars");
  });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "avi312singh@gmail.com",
    pass: gmailPassword,
  },
});

{
  module.exports = async () => {
    try {
      const directQueryInfo = await query
        .info(serverIp, 7778, 800)
        .then(query.close)
        .catch(console.error);

      const playerCountEmail = {
        from: "avi312singh@gmail.com",
        to: "avi312singh@gmail.com",
        subject: "FTYD player count: " + directQueryInfo.playersnum,
        text: "The player count has gone above 20! " + directQueryInfo,
      };

      directQueryInfo instanceof !Error && directQueryInfo.playersnum > 20;
      return transporter.sendMail(playerCountEmail, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is online!");
          console.log(
            "Email sent: " +
              info.response +
              " and this was returned from the server fetch request: " +
              directQueryInfo,
          );
        }
      });
    } catch (error) {
      return console.error(
        chalk.red(
          "Error occurred whilst sending a request to the server regarding its status with error: " +
            error,
        ),
      );
    }
  };
}
