const Document = require("../models/Document");
const { ObjectId } = require("../extras");

//#region renameDocumentVersion
const renameDocumentVersion = async (versionId, versionName) => {
  const _id = new ObjectId(versionId);
  await Document.updateOne({ _id }, { versionName });
};
//#endregion

module.exports = {
  renameDocumentVersion,
};
