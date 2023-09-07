const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");

const setUpSocketServer = require("./socket");

const passport = require("passport");
const passportSetup = require("./passport");

const authRoute = require("./routes/auth");
const documentRoute = require("./routes/document");
const userRoute = require("./routes/user");

const bodyParser = require("body-parser");

const cors = require("cors");

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

app.use(
  cors({
    origin: [process.env.CLIENT_URL,'http://localhost:5173', 'https://abhidocs.vercel.app', 'https://abhidocs.vercel.app/'],
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(
  cookieSession({ name: "session", keys: ["abhi"], maxAge: 24 * 60 * 60 * 100 })
);

require("dotenv").config();

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
  res.send("Hello World!");
});

app.post("/register", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRoute);
app.use("/documents", documentRoute);
app.use("/users", userRoute);
