const { default: axios } = require("axios");
const { getUserByGoogleId } = require("../controllers/UserController");

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")?.[1];

  if (token == null) {
    return res.status(401).json({
      success: false,
      error: "Unauthroized Access",
    });
  }

  try {
    const { data: userInfo } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (userInfo.user_id == undefined) {
      return res.status(403).json({
        success: false,
        error: "Unauthroized Access",
      });
    }

    // Todo: implement cache inside this function to get user from userId
    const user = await getUserByGoogleId(userInfo.user_id);

    if(user == null || user == undefined) {
      return res.status(403).json({
        success: false,
        error: "Bad access token"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({ error });
  }
}

module.exports = {
  authenticate
};
