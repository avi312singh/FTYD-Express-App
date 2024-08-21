const https = require("https");
const cookie = require("cookie");

module.exports = async () => {
  return new Promise((resolve, reject) => {
    let sessionid = "";
    try {
      https.get("https://store.steampowered.com/", (response) => {
        variable = response.headers["set-cookie"];
        console.log("session ID to be used from cookies array: ", variable);
        const cookies = cookie.parse(variable[1]);
        sessionid = cookies.sessionid;
        return sessionid
          ? setTimeout(() => {
              console.log("Waited for 1 minute");
              resolve(sessionid);
            }, 60000)
          : reject("Steam session id request failed");
      });
    } catch (error) {
      reject("Steam session id request failed");
    }
  });
};
