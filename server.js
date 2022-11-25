//Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env
//config will read your .env file, parse the contents, assign it to process.env, and return an Object with a parsed key containing the loaded content or an error key if it failed
require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger, logEvent } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const mongoose = require("mongoose");
const connectDb = require("./config/DbConn");
const PORT = process.env.PORT || 8000;

connectDb();

//logger middleware
app.use(logger);

//allowing CORS with corsOptions (only by selected resources)
app.use(cors(corsOptions));

//enabling json
app.use(express.json());

//enabling cookie parse
app.use(cookieParser());

//Telling express where to find static files such as css/html/images files that we would use on the server
//This is a middleware. Before going to any request, the request will first pass through this
app.use("/", express.static(path.join(__dirname, "public")));

console.log(process.env.NODE_ENV);
//routes
//for home page
app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoute"));
app.use("/users", require("./routes/userRoute"));
app.use("/notes", require("./routes/noteRoute"));

//for showing 404 page for unknown resource request
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("not found");
  }
});

//error middleware
app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDb");
  //listening the requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  logEvent(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoLog.log"
  );
});
