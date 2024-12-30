import { Document } from "../models/index.js";

//#region createDocument
const createDocument = async (data, userId) => {
  const documentId = new ObjectId();

  const result = await Document.create({
    documentId,
    data: {},
    name: "",
    ...data,
    createdBy: userId,
    modifiedBy: userId,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  });

  return documentId;
};
// #endregion

//#region createNewVersion Document
async function createNewVersionDocument(documentId, data, user_id) {
  if (!documentId) {
    throw new Error("Document id is not found in createNewVersionDocument");
  }

  const document = await Document.find({ documentId }).sort();

  if (!document) {
    throw new Error(
      "Document with given id is not found in createNewVersionDocument"
    );
  }

  const newDocument = await Document.create({
    documentId,
    ...data,
    createdBy: document.createdBy,
    createdAt: document.createdAt,
    modifiedBy: user_id,
    modifiedAt: Date.now(),
  });

  return newDocument;
}
//#endregion

//#region getDocumentListing
const getDocumentListing = async (documentIds, limit, offset) => {
  const result = await Document.aggregate([
    {
      $facet: {
        total: [{ $count: "totalCount" }],
        data: [
          {
            $match: {
              documentId: {
                $in: documentIds,
              },
            },
          },
          {
            $sort: {
              documentId: 1,
              _id: -1,
            },
          },
          {
            $group: {
              _id: "$documentId",
              latestDocument: {
                $first: "$$ROOT",
              },
            },
          },
          {
            $project: {
              id: "$latestDocument.documentId",
              name: "$latestDocument.name",
              modifiedAt: "$latestDocument.modifiedAt",
              createdAt: "$latestDocument.createdAt",
              modifiedBy: "$latestDocument.modifiedBy",
            },
          },
          {
            $skip: offset,
          },
          {
            $limit: limit,
          },
        ],
      },
    },
  ]);

  return { data: result[0].data, total: result[0].total[0]?.totalCount };
};
//#endregion

// #region getDocument
const getDocument = async (id) => {
  const documentId = new ObjectId(id);

  const result = await Document.aggregate([
    {
      $match: {
        documentId,
      },
    },
    {
      $sort: {
        documentId: 1,
        _id: -1,
      },
    },
    {
      $group: {
        _id: "$documentId",
        latestDocument: {
          $first: "$$ROOT",
        },
      },
    },
    {
      $project: {
        id: "$latestDocument.documentId",
        versionId: "$latestDocument._id",
        name: "$latestDocument.name",
        modifiedAt: "$latestDocument.modifiedAt",
        createdAt: "$latestDocument.createdAt",
        modifiedBy: "$latestDocument.modifiedBy",
        data: "$latestDocument.data",
      },
    },
  ]);

  return result[0];
};
// #endregion

//#region getDocumentVersions
const getDocumentVersions = async (id, type = "all") => {
  const documentId = new ObjectId(id);
  const matchObj = {
    documentId,
  }

  if (type !== "all") {
    matchObj.versionName = { $ne: null };
  }
  
  const result = await Document.aggregate([
    {
      $match: matchObj,
    },
    {
      $sort: {
        _id: -1, // Sort by _id only because documentId is same for all versions
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "modifiedBy",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $set: {
        id: "$documentId",
        versionId: "$_id",
        modifiedBy: { $arrayElemAt: ["$user", 0] }, // Get the first element of the array
      },
    },
    {
      $unset: ["_id", "documentId", "access", "__v", "createdAt", "user"],
    },
    {
      $project: {
        id: 1,
        versionId: 1,
        modifiedBy: { name: 1, id: "$modifiedBy._id" }, // Reshape the modifiedBy field
        data: 1,
        name: 1,
        modifiedAt: 1,
        versionName: 1
      },
    },
  ]);

  return result;
};

// #endregion

//#region updateDocument
async function updateDocument(
  documentId,
  versionId,
  data,
  user_id,
  modifiedAt
) {
  if (!documentId) return;
  if (modifiedAt) {
    // if time of updation has difference of more than 1 min
    // then create a new document version
    const currentTime = Date.now();
    const diff = currentTime - new Date(modifiedAt).getTime();
    const LIMIT = 1 * 60 * 60 * 60;

    if (diff > LIMIT) {
      return createNewVersionDocument(documentId, data, user_id);
    }
  }

  await Document.updateOne(
    { _id: new ObjectId(versionId) },
    { ...data, modifiedAt: Date.now(), modifiedBy: user_id }
  );
}

//#endregion

// #region deleteDocument
const deleteDocument = async (id) => {
  const documentId = new ObjectId(id);
  const result = await Document.deleteMany({ documentId });
  await DocumentAccess.deleteMany({ documentId });

  return result.deletedCount > 0;
};
//#endregion

export {
  createNewVersionDocument,
  createDocument,
  deleteDocument,
  updateDocument,
  getDocument,
  getDocumentListing,
  getDocumentVersions,
};
