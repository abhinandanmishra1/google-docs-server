import {
  authRouter,
  documentAccessRouter,
  documentRouter,
  documentVersionRouter,
  userRouter,
} from "../../routes/index.js";

import { authenticate } from "../../middleware/auth_middleware.js";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import serverless from "serverless-http";
import { setUpSocketServer } from "../../socket.js";

dotenv.config();
const app = express();

app.use(
  cookieSession({
    name: "session",
    keys: ["abhi"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Request logger start
const requestLogger = (request, response, next) => {
  console.log(`${request.method} url:: ${request.url}`);
  next();
};

app.use(requestLogger);
// Request Logger end

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "https://abhidocs.vercel.app",
      "https://abhidocs.vercel.app/",
    ],
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true,
  })
);

app.use(
  cookieSession({ name: "session", keys: ["abhi"], maxAge: 24 * 60 * 60 * 100 })
);

mongoose.connect(process.env.MONGO_CONNECT_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.DB_NAME,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Databse Connected successfully");
});

setUpSocketServer(app);

app.get("/", (req, res) => {
  res.send({
    message: "Server is healthy"
  });
});

app.post("/register", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/documents", authenticate, documentRouter);
app.use("/versions", authenticate, documentVersionRouter);
app.use("/users", userRouter);
app.use("/access", authenticate, documentAccessRouter);

export const handler = serverless(app);