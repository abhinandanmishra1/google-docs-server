const Document = require("../models/Document");
const {
  getDocument,
  getDocumentListing,
  createDocument,
} = require("../controllers/DocumentController");
const { ObjectId } = require("../extras");
const { PermissionsEnum } = require("../enums/PermissionEnum");
const {
  setDocumentPrivateAccess,
  setDocumentPublicAccess,
  getDocumentAccess,
  getDocumentIdsWithAccessType,
} = require("../controllers/DocumentAccessControler");

const router = require("express").Router();

// baseurl = "/documents"

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const role = await getDocumentAccess(id, req.user.id);

    if (role === "none") {
      return res
        .status(401)
        .send({ message: "You don't have access to this document" });
    }

    const document = await getDocument(id);

    if (document != null) {
      res.status(200).send({ document, role });
    } else {
      res.status(404).send({ error: "Document not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

/*
  Get document listing
  ownedBy: "me" | "any" | "others"
*/
router.get("", async (req, res) => {
  const { limit = 10, offset = 0, ownedBy = "me" } = req.query;
  console.log(ownedBy);

  const { user: userInfo } = req;

  const documentIds = await getDocumentIdsWithAccessType(ownedBy, userInfo.id);

  try {
    const result = await getDocumentListing(documentIds, limit, offset);

    res.status(201).send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.post("", async (req, res) => {
  const { user: userInfo, body } = req;

  try {
    const documentId = await createDocument(body, userInfo.id);

    if (!documentId) {
      return res.status(500).send({ message: "something went wrong" });
    }

    // add public and private access
    await setDocumentPrivateAccess(
      documentId,
      userInfo.id,
      PermissionsEnum.ALL,
      userInfo.id
    );
    await setDocumentPublicAccess(documentId, 0, userInfo.id);

    res.status(201).send({ id: documentId });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const documentId = new ObjectId(id);

    const result = await Document.updateOne(
      {
        documentId,
      },
      { ...data, modifiedAt: Date.now() }
    );

    if (result.upsertedCount) {
      return res.status(500).send({ message: "Document not found" });
    }
    res.status(200).send({ msg: "Document updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const documentId = new ObjectId(id);

  try {
    const result = await Document.deleteOne({ documentId });

    if (result.deletedCount === 0) {
      return res.status(400).send({ message: "Document not found" });
    }

    return res.status(200).send({ msg: "Successfully deleted" });
  } catch (error) {
    res.send({ error });
  }
});

module.exports = router;
