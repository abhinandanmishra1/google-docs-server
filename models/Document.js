const { Schema, model } = require("mongoose");

// every new instance of document opened will create a new version
const UserAccessSchema = new Schema({
  user: String,
  type: String,
});
const DocumentSchema = new Schema({
  // _id: String, // id of each version of document
  documentId: Schema.Types.ObjectId, // real documentId
  data: Object,
  name: String,
  createdAt: { type: Date, default: Date.now() },
  createdBy: String, // storing on basis of google.user.id
  modifiedAt: { type: Date, default: Date.now() },
  modifiedBy: String,
  sharedWithEveryone: { type: Boolean, default: false },
  access: [UserAccessSchema],
});

const Document = model("Document", DocumentSchema);

module.exports = Document;
