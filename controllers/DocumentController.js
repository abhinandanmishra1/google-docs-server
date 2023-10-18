const { default: mongoose } = require("mongoose");
const Document = require("../models/Document");
const { getAccessRole, PermissionsEnum } = require("../enums/PermissionEnum");
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

const getDocument = async (id, user_id) => {
  // we have to check what access does this user have for this document
  const documentId = new mongoose.Types.ObjectId(id);
  const userId = new mongoose.Types.ObjectId(user_id);

  const result = await Document.aggregate([
    {
      $match: {
        documentId,
      },
    },
    {
      $facet: {
        permissions: [
          {
            $match: {
              "access.user": userId,
            },
          },
          {
            $project: { _id: 0, "access.type": 1 },
          },
          { $unwind: "$access" },
        ],
        data: [
          { $set: { id: "$documentId", versionId: "$_id" } },
          { $unset: ["_id", "documentId", "access"] },
        ],
      },
    },
    { $unwind: { path: "$permissions", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$data" } },
    {
      $project: {
        permissions: "$permissions.access.type",
        data: 1,
      },
    },
  ]);

  const document = result[0]?.data;
  const permission = result[0]?.permissions | document?.sharedWithEveryone;

  const role = getAccessRole(permission);
  return {
    document,
    role,
  };
};

async function updateDocument(documentId, data, user_id) {
  if (!documentId) return;

  await Document.updateOne(
    { documentId },
    { ...data, modifiedAt: Date.now(), modifiedBy: user_id }
  );
}

async function getDocumentUsers(documentId) {
  const result = await Document.aggregate([
    {
      $match: {
        documentId,
      },
    },
    {
      $facet: {
        data: [
          {
            $set: {
              id: "$documentId",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "access.user",
              foreignField: "_id",
              as: "users",
            },
          },
          {
            $unset: [
              "name",
              "documentId",
              "_id",
              "__v",
              "createdAt",
              "createdBy",
              "data",
              "modifiedAt",
              "modifiedBy",
              // "access",
              // "users._id",
              "users.googleId",
              "users.refreshToken",
              "users.__v",
            ],
          },
        ],
        data2: [
          {
            $set: {
              id: "$documentId",
            },
          },
          {
            $unset: [
              "name",
              "documentId",
              "_id",
              "__v",
              "createdAt",
              "createdBy",
              "data",
              "modifiedAt",
              "modifiedBy",
              // "access",
              // "users._id",
              "users.googleId",
              "users.refreshToken",
              "users.__v",
            ],
          },
        ],
      },
    },
  ]);

  
  const { users, access, sharedWithEveryone, id } = result[0]?.data[0] || {};

  const userIdToRoleMapping = (access || [])?.reduce((acc, curr) => {
    acc[curr.user] = getAccessRole(curr.type);  
    return acc;
  }, {});

  const usersWithRole = (users || []).map((user) => ({
    ...user,
    role: userIdToRoleMapping[user._id],
  }));

  return {
    users: usersWithRole,
    id,
    sharedWithEveryone,
  };
}

/*
  Update user role
  userId - id of user
  documentId 
  role: VIEW | EDIT | ADMIN
*/

const updateUserRole = async (userId, documentId, role) => {
  await Document.updateOne(
    { documentId: new ObjectId(documentId) },
    { $addToSet: { access: { user: userId, type: PermissionsEnum[role] } } }
  );
};

module.exports = {
  createNewVersionDocument,
  updateDocument,
  getDocument,
  getDocumentUsers,
  updateUserRole,
};
