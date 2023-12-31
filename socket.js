const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();

const {
  updateDocument,
  createNewVersionDocument,
  getDocument,
} = require("./controllers/DocumentController");
const validateToken = require("./helpers/validateToken");
const { getDocumentAccess } = require("./controllers/DocumentAccessControler");

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
    let user = null;
    let user_id = null;

    socket.on("get-document", async (documentId) => {
      if (!documentId) return;
      let mongoDocumentId = null;

      try {
        // const document = await createNewVersionDocument(documentId, user);  -> TODO: how to get user?
        user = await validateToken(token);
        user_id = user.id;

        const role = await getDocumentAccess(documentId, user.id);

        if (role === "none") {
          throw new Error("You don't have access to this document");
        }

        const document = await getDocument(documentId, user.id);

        if (document == null) {
          throw new Error("Document not found");
        }

        mongoDocumentId = document?.id; // id here means documentId
        socket.join(documentId);
        socket.emit("load-document", { document, role });
        socket.broadcast.to(documentId).emit("load-user", user);
      } catch (err) {
        console.log(err);
      }

      socket.on("update-me", () => {
        socket.broadcast.to(documentId).emit("recieve-me", user);
      });

      socket.on("send-changes", (data) => {
        socket.broadcast.to(documentId).emit("recieve-changes", data);
      });

      socket.on("save-document", (data) => {
        // documentId = mongoDocumentId;
        // documentId is for docuemnt's id, _id is for the version of that document
        updateDocument(mongoDocumentId, data, user_id); // updating the version data
      });

      socket.on("name-update", (name) => {
        const data = { name };
        updateDocument(mongoDocumentId, data, user_id);
        socket.broadcast.to(documentId).emit("recieve-name", name);
      });

      socket.on("disconnect-event", () => {
        socket.broadcast.to(documentId).emit("remove-me", user);
      });
    });
  });
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

module.exports = setUpSocketServer;
