const express   = require('express');
const app       = require("./myServer/app");
const debug     = require("debug")("node-angular");
const path      = require('path');
const http      = require("http");
const mongoose  = require("mongoose");

// MongoDB connection
mongoose.connect("mongodb+srv://frshr:frshr@2020@frshr.o4qz8.mongodb.net/ats?retryWrites=true&w=majority",
{ useNewUrlParser: true,
  useCreateIndex:true,
  useFindAndModify:false,
  useUnifiedTopology: true
}).then(() => {
    console.log("Connected to ATS database");
}).catch(err => {
    console.log("Error connecting to ATS database",err.message);
});

// Connection Port setup
const normalizePort = val => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

// Connection port exception handling
const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Serving the assets
app.use(express.static(__dirname + '/myServer/assets'));

// Serving the frontend pages from the dist folder
app.use(express.static(__dirname + '/dist/Jyon'));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname + '/dist/Jyon/index.html'));
});

// Server setup
const onListening = () => {
  const addr = server.address();
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "8089");
app.set("port", port);

const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);
server.listen(port, () => {
  console.log("Server started on port 8089");
});