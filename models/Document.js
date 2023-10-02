const { Schema, model } = require("mongoose");

// every new instance of document opened will create a new version

/*
 Permissions defined 
 1: View
 2: Edit
 4: All
*/

const UserAccessSchema = new Schema({
  user: Schema.Types.ObjectId,
  type: Number,  
});

const DocumentSchema = new Schema({
  // _id: String, // id of each version of document
  documentId: Schema.Types.ObjectId, // real documentId
  data: Object,
  name: String,
  createdAt: { type: Date, default: Date.now() },
  createdBy: Schema.Types.ObjectId, // storing on basis of google.user.id
  modifiedAt: { type: Date, default: Date.now() },
  modifiedBy: Schema.Types.ObjectId,
  sharedWithEveryone: { type: Number, default: 0 },
  access: [UserAccessSchema],
});

const Document = model("Document", DocumentSchema);

module.exports = Document;
