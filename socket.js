import { DocumentAccessController } from "./controllers/index.js";
import {
  DocumentController,
} from "./controllers/index.js";
import { Server } from "socket.io";
import dotenv from "dotenv";
import http from "http";
import { validateToken } from "./helpers/validateToken.js";

dotenv.config();


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
      let modifiedAt = -1;
      let versionId = null;
      let name = "";

      try {
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
        
        modifiedAt = document?.modifiedAt;
        mongoDocumentId = document?.id; // id here means documentId
        versionId = document?.versionId;
        name = document?.name;
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

      socket.on("save-document", async (data) => {
        // documentId = mongoDocumentId;
        // documentId is for docuemnt's id, _id is for the version of that document
        data.name = name;
        const document = await updateDocument(mongoDocumentId, versionId, data, user_id, modifiedAt);
        if(document) {
          // that means new version is created
          modifiedAt = document.modifiedAt;
          versionId = document._id;
        }
      });

      socket.on("name-update", async (updatedName) => {
        const data = { name: updatedName };
        name = updatedName;
        await updateDocument(mongoDocumentId, versionId, data, user_id);
        socket.broadcast.to(documentId).emit("recieve-name", updatedName);
      });

      socket.on("disconnect-event", () => {
        socket.broadcast.to(documentId).emit("remove-me", user);
      });
    });
  });
  const PORT = process.env.PORT || 5001;

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

export { setUpSocketServer };
