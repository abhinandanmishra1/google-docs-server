const {
  renameDocumentVersion,
} = require("../controllers/DocumentVersionController");
const router = require("express").Router();

router.post("/:versionId", async (req, res) => {
  const { versionId } = req.params;
  const { versionName } = req.body;

  try {
    await renameDocumentVersion(versionId, versionName);
    res.status(200).send({ msg: "Version name updated successfully" });
  } catch (error) {
    res.status(error.statusCode || 400).send({ message: error.message });
  }
});

module.exports = router
