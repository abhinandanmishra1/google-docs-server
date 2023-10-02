const { default: mongoose } = require("mongoose");
const Document = require("../models/Document");
const { getAccessRole } = require("../enums/PermissionEnum");

async function createNewVersionDocument(documentId, user) {
  const document = await Document.find({ documentId });

  if (document.length === 1) {
    if (!document.modifiedBy) {
      await Document.updateOne(
        { _id: document._id },
        { modifiedBy: user.id, modifiedAt: Date.now }
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
  id = new mongoose.Types.ObjectId(id);
  const result = await Document.aggregate(
    [
      {
        $match: {
          documentId: id,
        },
      },
      {
        $facet: {
          permissions: [
            {
              $project: {
                access: "$access.type",
                _id: 0,
              },
            },
            { $unwind: { path: "$access" } },
          ],
          data: [{ $project: { access: 0 } }],
        },
      },
      { $unwind: { path: "$data" } },
      { $unwind: { path: "$permissions" } },
    ],
  );
  
  const document = result[0]?.data;
  const permission = result[0]?.permissions.access | document.sharedWithEveryone;

  const role = getAccessRole(permission);
  return {
    document,
    role
  };
};

async function updateDocument(id, data) {
  if (!id) return;

  await Document.updateOne({ _id: id }, { ...data });
}

module.exports = {
  createNewVersionDocument,
  updateDocument,
  getDocument,
};
