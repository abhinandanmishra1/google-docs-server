import { DocumentVersionController } from "../controllers/index.js";
import { Router } from "express";

const router = Router();

router.post("/:versionId", async (req, res) => {
  const { versionId } = req.params;
  const { versionName } = req.body;

  try {
    await DocumentVersionController.renameDocumentVersion(versionId, versionName);
    res.status(200).send({ msg: "Version name updated successfully" });
  } catch (error) {
    res.status(error.statusCode || 400).send({ message: error.message });
  }
});

export default router;
