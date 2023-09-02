const router = require("express").Router();
const passport = require("passport");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const CLIENT_URL = process.env.CLIENT_URL;

router.get("/login/success", (req, res) => {
  if (req.user) {
    const user = jwt.decode(req.user.id_token);
    console.log({ user });
    res.status(200).json({
      success: true,
      user: {
        name: user?.name,
        picture: user?.picture,
        id: user?.sub,
      },
      //   cookies: req.cookies
    });
  } else {
    res.status(401).json({
      success: false,
      message: "unauthorized",
    });
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

router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failed",
  })
);

module.exports = router;
