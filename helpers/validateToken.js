const { default: axios } = require("axios");
const { getUserByGoogleId } = require("../controllers/UserController");

async function validateToken(token) {
  return new Promise(async (resolve, reject) => {
    if (token == null) {
      reject("Unauthroized Access");
    }

    const { data: userInfo } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (userInfo.user_id == undefined) {
      reject("Unauthroized Access");
    }

    const user = await getUserByGoogleId(userInfo.user_id);

    if(user == null || user == undefined) {
      reject("Bad access token");
    }

    resolve(user);
  });
}

module.exports = validateToken;
