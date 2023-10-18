const Document = require("../models/Document");
const { getDocument, getDocumentUsers, updateUserRole } = require("../controllers/DocumentController");
const { ObjectId } = require("../extras");
const { getUserByEmail } = require("../controllers/UserController");
const { PermissionsEnum } = require("../enums/PermissionEnum");

const router = require("express").Router();

// baseurl = "/documents"

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { document, role } = await getDocument(id, req.user.id);

    if (document != null) {
      res.status(200).send({ document, role });
    } else {
      res.status(401).send({ error: "Document not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("", async (req, res) => {
  const { limit = 10, offset = 0 } = req.body;
  const { user: userInfo } = req;

  try {
    const result = await Document.aggregate([
      {
        $facet: {
          total: [{ $count: "totalCount" }],
          data: [
            {
              $match: {
                createdBy: userInfo.id,
              },
            },
            {
              $skip: offset,
            },
            {
              $limit: limit,
            },
            {
              $sort: { createdAt: 1 },
            },
            {
              $set: {
                id: "$documentId",
              },
            },
            {
              $unset: ["_id", "documentId", "data"],
            },
          ],
        },
      },
    ]);
    res.status(201).send(result[0]);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.post("", async (req, res) => {
  const { user: userInfo, body } = req;

  try {
    const documentId = new ObjectId();

    const result = await Document.create({
      documentId,
      data: {},
      name: "",
      ...body,
      createdBy: userInfo.id,
      createdAt: Date.now(),
      access: [
        {
          user: userInfo.id,
          type: PermissionsEnum.ALL
        },
      ],
    });

    if (!result) {
      return res.status(500).send({ message: "something went wrong" });
    }
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

router.get("/:id/users", async (req, res) => {
  const { id } = req.params;
  const documentId = new ObjectId(id);

  try {
    const result = await getDocumentUsers(documentId);

    res.status(200).send(result);
  }catch(err) {
    res.status(500).send({ message: err.message });
  }
});

router.patch("/:id/users", async (req, res) => {
  const { id } = req.params;
  const { email, role} = req.body;
  console.log(email, role);


  try {
    const user= await getUserByEmail(email);

    if(!user) {
      return res.status(404).send({ message: "User not found" });
    }

    await updateUserRole(user.id, id, role);

    res.status(200).send("User updated successfully");
  }catch(err) {
    res.status(500).send({ message: err.message });
  }
})

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
