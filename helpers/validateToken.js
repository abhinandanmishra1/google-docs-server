import { UserController } from "../controllers/index.js";
import axios from "axios";

async function validateToken(token) {
  return new Promise(async (resolve, reject) => {
    if (token == null) {
      reject("Unauthroized Access");
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
        reject("Unauthroized Access");
      }

      const user = await UserController.getUserByGoogleId(userInfo.user_id);

      if (user == null || user == undefined) {
        reject("Bad access token");
      }

      resolve(user);
    } catch (error) {
      reject(error);
    }
  });
}

export { validateToken };
