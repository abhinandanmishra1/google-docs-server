const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();

const {
  updateDocument,
  createNewVersionDocument,
  getDocument,
} = require("./controllers/DocumentController");

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
    socket.on("get-document", async (documentId) => {
      if (!documentId) return;

      let mongoDocumentId = null;

      try {
        // const document = await createNewVersionDocument(documentId, user);  -> TODO: how to get user?
        const document = await getDocument(documentId);
        mongoDocumentId = document?._id;
        console.log("document", documentId, document);
        socket.join(documentId);
        socket.emit("load-document", document);
      } catch (err) {
        console.log(err);
      }

      socket.on("send-changes", (data) => {
        socket.broadcast.to(documentId).emit("recieve-changes", data);
      });

      socket.on("save-document", (data) => {
        console.log("save document", data);
        updateDocument(mongoDocumentId, data); // updating the version data
      });
    });
  });
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

module.exports = setUpSocketServer;
