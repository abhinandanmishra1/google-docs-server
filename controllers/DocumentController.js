const { default: mongoose } = require("mongoose");
const Document = require("../models/Document");
const { getAccessRole } = require("../enums/PermissionEnum");

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
        data: [{ $project: { access: 0 } }],
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

async function updateDocument(id, data) {
  if (!id) return;

  await Document.updateOne({ _id: id }, { ...data, modifiedAt: Date.now() });
}

module.exports = {
  createNewVersionDocument,
  updateDocument,
  getDocument,
};
