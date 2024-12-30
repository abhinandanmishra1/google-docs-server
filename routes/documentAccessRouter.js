import {
  DocumentAccessController,
  UserController,
} from "../controllers/index.js";

import { ObjectId } from "../extras/index.js";
import { PermissionsEnum } from "../enums/PermissionEnum.js";
import { Router } from "express";

const router = Router();

router.get("/:id/users", async (req, res) => {
  const { id } = req.params;
  const userId = new ObjectId(req.user.id);
  const documentId = new ObjectId(id);

  try {
    const result = await DocumentAccessController.getDocumentUsers(documentId, userId);

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
    const user = await UserController.getUserByEmail(email);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (req.user.id.toString() == user.id.toString()) {
      return res.status(401).send({ message: "You can't update your role" });
    }

    const userId = new ObjectId(user.id);
    const documentId = new ObjectId(id);
    await DocumentAccessController.setDocumentPrivateAccess(
      documentId,
      userId,
      PermissionsEnum[role]
    );

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

    const role = await DocumentAccessController.getDocumentAccess(
      documentId,
      userId
    );

    res.status(200).send({ role });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

export default router;
