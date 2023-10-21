const DocumentAccess = require("../models/DocumentAccess");
const { getAccessRole, PermissionsEnum } = require("../enums/PermissionEnum");
const { ObjectId } = require("../extras");

const getDocumentAccess = async (documentId, userId) => {
  const result = await DocumentAccess.aggregate([
    {
      $match: {
        documentId: new ObjectId(documentId),
      },
    },
    {
      $facet: {
        public: [{ $match: { accessType: "PUBLIC" } }],
        private: [
          { $match: { accessType: "PRIVATE", userId: new ObjectId(userId) } },
        ],
      },
    },
    {
      $unwind: "$public",
    },
    {
      $unwind: "$private",
    },
  ]);

  const { public, private } = result[0] || {};

  const permission = (public?.permission || 0) | (private?.permission || 0);
  return getAccessRole(permission);
};

const getDocumentIdsWithAccessType = async (ownedBy, userId) => {
  const matchObject = { accessType: "PRIVATE" };
  if (ownedBy === "me") {
    matchObject.modifiedBy = userId;
  } else if (ownedBy === "others") {
    matchObject.modifiedBy = { $ne: userId };
    matchObject.userId = { $eq: userId };
  } else {
    matchObject.userId = { $eq: userId };
  }

  const result = await DocumentAccess.aggregate([
    {
      $match: matchObject,
    },
    {
      $project: {
        documentId: 1,
        _id: 0,
      },
    },
  ]);

  return result.map((item) => item.documentId);
};

const setDocumentPrivateAccess = async (
  documentId,
  userId,
  permission,
  modifiedBy
) => {
  await DocumentAccess.updateOne(
    {
      documentId,
      userId,
      accessType: "PRIVATE",
    },
    {
      $set: {
        permission,
        modifiedAt: Date.now(),
        modifiedBy,
      },
    },
    { upsert: true }
  );
};

const setDocumentPublicAccess = async (documentId, permission, modifiedBy) => {
  await DocumentAccess.updateOne(
    {
      documentId,
      accessType: "PUBLIC",
    },
    {
      $set: {
        permission,
        modifiedAt: Date.now(),
        modifiedBy,
      },
    },
    { upsert: true }
  );
};

const getDocumentUsers = async (documentId) => {
  const result = await DocumentAccess.aggregate([
    {
      $match: {
        documentId,
      },
    },
    {
      $facet: {
        public: [
          { $match: { accessType: "PUBLIC" } },
          {
            $unset: [
              "_id",
              "__v",
              "modifiedAt",
              "modifiedBy",
              "accessType",
              "documentId",
              "userId",
            ],
          },
        ],
        private: [
          { $match: { accessType: "PRIVATE" } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $set: {
              name: "$user.name",
              email: "$user.email",
              picture: "$user.picture",
            },
          },
          {
            $unset: [
              "_id",
              "__v",
              "modifiedAt",
              "modifiedBy",
              "accessType",
              "documentId",
              "user",
            ],
          },
        ],
      },
    },
    {
      $unwind: "$public",
    },
  ]);

  return result[0];
};

const deleteDocumentAccess = async (documentId, userId) => {
  await DocumentAccess.deleteMany({
    documentId,
  });
};

module.exports = {
  getDocumentAccess,
  setDocumentPrivateAccess,
  setDocumentPublicAccess,
  deleteDocumentAccess,
  getDocumentUsers,
  getDocumentIdsWithAccessType,
};
