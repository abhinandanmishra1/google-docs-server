const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();

const {
  updateDocument,
  createNewVersionDocument,
  getDocument,
} = require("./controllers/DocumentController");
const validateToken = require("./helpers/validateToken");
const { getAccessRole } = require("./enums/PermissionEnum");

const setUpSocketServer = (app) => {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "https://abhidocs.vercel.app",
        "https://abhidocs.vercel.app/",
      ],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const { token } = socket.handshake.query;
    let user_id = null;

    socket.on("get-document", async (documentId) => {
      if (!documentId) return;
      let mongoDocumentId = null;

      try {
        // const document = await createNewVersionDocument(documentId, user);  -> TODO: how to get user?
        const user = await validateToken(token);
        user_id = user.id;

        const { document, role } = await getDocument(documentId, user.id);

        if (document == null) {
          throw new Error("Document not found");
        }

        mongoDocumentId = document?.id;  // id here means documentId
        socket.join(documentId);
        socket.emit("load-document", { document, role });
      } catch (err) {
        console.log(err);
      }

      socket.on("send-changes", (data) => {
        socket.broadcast.to(documentId).emit("recieve-changes", data);
      });

      socket.on("save-document", (data) => {
        // documentId = mongoDocumentId;  
        // documentId is for docuemnt's id, _id is for the version of that document
        updateDocument(mongoDocumentId, data, user_id); // updating the version data
      });
    });
  });
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

module.exports = setUpSocketServer;
