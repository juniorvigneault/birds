const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  // Relay the bird image data to all clients
  socket.on("birdImage", (data) => {
    io.emit("birdImage", data); // Broadcast image data to all connected clients
  });

  // Listen for 'mouseState' from the client and broadcast to others
  socket.on("mouseState", (data) => {
    console.log("Mouse state received: ", data);
    io.emit("mouseState", data); // Broadcast to all connected clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
