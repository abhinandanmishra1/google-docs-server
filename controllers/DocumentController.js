const Document = require("../models/Document");

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

const getDocument = async (id) => {
  const document = await Document.findOne({ documentId: id });

  return document;
}

async function updateDocument(id, data) {
  if(!id) return;

  await Document.updateOne({ _id: id }, { ...data });
}

module.exports = {
  createNewVersionDocument,
  updateDocument,
  getDocument
};
