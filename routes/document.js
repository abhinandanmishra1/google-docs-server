const { default: mongoose } = require("mongoose");
const Document = require("../models/Document");
const { default: axios } = require("axios");

const router = require("express").Router();

// baseurl = "/documents"

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
  const token = req.headers.authorization?.split(" ")?.[1];

  if(!token) {
    return res.status(401).send({ message: "unauthorized" });
  }

  const { data: userInfo } = await axios.get(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  try {
    const result = await Document.aggregate([
      {
        $facet: {
          total: [{ $count: "totalCount" }],
          data: [
            {
              $match: {
                createdBy: userInfo.user_id,
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
  const token = req.headers.authorization?.split(" ")?.[1];

  if(!token) {
    return res.status(401).send({ message: "unauthorized" });
  }

  const { data: userInfo } = await axios.get(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  try {
    const documentId = new mongoose.Types.ObjectId();

    const result = await Document.create({
      documentId,
      data: {},
      name: "",
      createdBy: userInfo.user_id,
      createdAt: Date.now(),
      access: [
        {
          user: userInfo.user_id,
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
