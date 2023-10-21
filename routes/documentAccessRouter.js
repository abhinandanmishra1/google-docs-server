const {
  getDocumentUsers,
  setDocumentPrivateAccess,
  getDocumentAccess,
} = require("../controllers/DocumentAccessControler");
const { getUserByEmail } = require("../controllers/UserController");
const { PermissionsEnum } = require("../enums/PermissionEnum");
const { ObjectId } = require("../extras");

const router = require("express").Router();

router.get("/:id/users", async (req, res) => {
  const { id } = req.params;
  const userId = new ObjectId(req.user.id);
  const documentId = new ObjectId(id);

  try {
    const result = await getDocumentUsers(documentId, userId);

    if (!result) {
      return res.status(404).send({ message: "Document not found" });
    }

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.patch("/:id/users", async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (req.user.id.toString() == user.id.toString()) {
      return res.status(401).send({ message: "You can't update your role" });
    }

    const userId = new ObjectId(user.id);
    const documentId = new ObjectId(id);
    await setDocumentPrivateAccess(documentId, userId, PermissionsEnum[role]);

    res.status(200).send("User updated successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("/:id/role", async (req, res) => {
  const { id } = req.params;
  const { user } = req.query;

  if (!id || !user) return res.status(400).send({ message: "Missing fields" });

  try {
    const documentId = new ObjectId(id);
    const userId = new ObjectId(user);

    const role = await getDocumentAccess(documentId, userId);

    res.status(200).send({ role });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

module.exports = router;
