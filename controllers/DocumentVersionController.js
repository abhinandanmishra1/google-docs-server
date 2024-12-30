import { Document } from "../models/index.js";
import { ObjectId } from "../extras/index.js";
//#region renameDocumentVersion
const renameDocumentVersion = async (versionId, versionName) => {
  const _id = new ObjectId(versionId);
  await Document.updateOne({ _id }, { versionName });
};
//#endregion

export { renameDocumentVersion };
