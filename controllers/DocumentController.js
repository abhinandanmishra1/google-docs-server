const Document = require("../models/Document");
const { ObjectId } = require("../extras");

async function createNewVersionDocument(documentId, user) {
  const document = await Document.find({ documentId });

  if (document.length === 1) {
    if (!document.modifiedBy) {
      await Document.updateOne(
        { _id: document._id },
        { modifiedBy: user.id, modifiedAt: Date.now() }
      );

      document.modifiedBy = user.id;
      document.modifiedAt = Date.now();

      return document;
    }
  }

  const newDocument = await Document.create({
    documentId,
    data: document.data,
    name: document.name,
    createdBy: document.createdBy,
    createdAt: document.createdAt,
    modifiedBy: user.id,
    modifiedAt: Date.now(),
  });

  return newDocument;
}

const getDocumentListing = async (userId, limit, offset) => {
  const result = await Document.aggregate([
    {
      $facet: {
        total: [{ $count: "totalCount" }],
        data: [
          {
            $match: {
              createdBy: userId,
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
            $unset: ["_id", "documentId", "data", "__v"],
          },
        ],
      },
    },
  ]);

  
  return { data: result[0].data, total: result[0].total[0].totalCount };
};

const getDocument = async (id) => {
  // we have to check what access does this user have for this document
  const documentId = new ObjectId(id);

  const result = await Document.aggregate([
    {
      $match: {
        documentId,
      },
    },
    {
      $facet: {
        data: [
          { $set: { id: "$documentId", versionId: "$_id" } },
          { $unset: ["_id", "documentId", "access", "__v"] },
        ],
      },
    },
    { $unwind: { path: "$data" } },
  ]);

  const document = result[0]?.data;

  return document;
};

const createDocument = async (data, userId) => {
  const documentId = new ObjectId();

  const result = await Document.create({
    documentId,
    data: {},
    name: "",
    ...data,
    createdBy: userId,
    createdAt: Date.now(),
  });

  return documentId;
};

async function updateDocument(documentId, data, user_id) {
  if (!documentId) return;

  await Document.updateOne(
    { documentId },
    { ...data, modifiedAt: Date.now(), modifiedBy: user_id }
  );
}

/*
  Update user role
  userId - id of user
  documentId 
  role: VIEW | EDIT | ADMIN
*/

module.exports = {
  createNewVersionDocument,
  createDocument,
  updateDocument,
  getDocument,
  getDocumentListing,
};
