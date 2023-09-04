const jwt = require("jsonwebtoken");
const {
  findOrCreateUser,
  updateUser,
  getUserById,
} = require("../controllers/UserController");
const router = require("express").Router();

router.post("", async (req, res) => {
  // todo: add authentication here only authenticated can create user
  if (!req.body.refreshToken || !req.body.idToken) {
    return res.status(401).send({ msg: "Missing fields" });
  }

  try {
    const userInfo = jwt.decode(req.body.idToken);
    console.log(userInfo)
    const createUserObject = {
      googleId: userInfo.sub,
      refreshToken: req.body.refreshToken,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
    };

    const user = await findOrCreateUser(createUserObject);

    if (!user) {
      return res
        .status(500)
        .send({ msg: "There was an error in creating the user" });
    }

    res.status(201).send({
      user,
    });
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  if (!req.body.refreshToken) {
    return res.status(401).send({ msg: "Missing fields" });
  }

  const updateObject = {
    refreshToken: req.body.refreshToken,
  };

  const user = await getUserById(id);

  if (!user) {
    return res.status(404).send({ msg: "User not found" });
  }

  const updatedUser = await updateUser(id, updateObject);

  res.status(201).send({
    user: updatedUser,
  });
});

module.exports = router;
