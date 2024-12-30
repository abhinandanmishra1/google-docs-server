import { Schema, model } from "mongoose";

// every new instance of document opened will create a new version

/*
 Permissions defined 
 1: View
 2: Edit
 4: Admin
 8: All
*/

const DocumentAccessSchema = new Schema({
  documentId: Schema.Types.ObjectId, // real documentId
  userId: Schema.Types.ObjectId,  // null when public
  permission: Number,
  accessType: String, // "PUBLIC" || "PRIVATE"
  modifiedAt: { type: Date, default: Date.now() },
  modifiedBy: Schema.Types.ObjectId,
});

const DocumentAccess = model("DocumentAccess", DocumentAccessSchema);

export default DocumentAccess;
