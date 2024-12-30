import { OAuth2Client, UserRefreshClient } from "google-auth-library";

import { Router } from "express";
import { UserController } from "../controllers/index.js";
import axios from "axios";
import dotenv from "dotenv";
import passport from "passport";

dotenv.config();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

const CLIENT_URL = process.env.CLIENT_URL;

const router = Router()

router.get("/login/success", async (req, res) => {
  const token = req.headers.authorization?.split(" ")?.[1];

  try {
    const { data: userInfo } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const user = await UserController.getUserByGoogleId(userInfo.user_id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(400).json({ err });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(CLIENT_URL);
});

router.post("/google", async (req, res) => {
  try {
    const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
    res.json(tokens);
  } catch (err) {
    res.status(500).json({
      err,
    });
  }
});

router.post("/google/refresh-token", async (req, res) => {
  try {
    const user = new UserRefreshClient(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      req.body.refreshToken
    );
  
    const { credentials } = await user.refreshAccessToken(); // optain new tokens
    res.json(credentials);
  } catch(err) {
    res.status(500).json({
      err,
    });
  }
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failed",
  })
);

export default router;
