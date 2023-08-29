const { default: mongoose } = require("mongoose");
const Document = require("../models/Document");

const router = require("express").Router();

// baseurr = "/documents"

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const document = await Document.findById(id);
    res.status(201).send(document);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("", async (req, res) => {
  const { limit = 10, offset = 0 } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).send({ message: "unauthorized" });
  }

  try {
    const result = await Document.aggregate([
      {
        $facet: {
          total: [{ $count: "totalCount" }],
          data: [
            {
              $match: {
                createdBy: user.id,
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
  const user = req.user;

  console.log(user);

  if (!user) {
    return res.status(401).send({ message: "unauthorized" });
  }

  try {
    const documentId = new mongoose.Types.ObjectId();

    const result = await Document.create({
      documentId,
      data: {},
      name: "",
      createdBy: user.id,
      createdAt: Date.now(),
      access: [
        {
          user: user.id,
          type: "admin",
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

module.exports = router;
