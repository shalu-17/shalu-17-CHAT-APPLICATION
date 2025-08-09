// server.js
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname + "/public"));

const users = {};
const messageHistory = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  // Send chat history to new user
  socket.emit("messageHistory", messageHistory);

  // Handle user joining
  socket.on("join", (name) => {
    users[socket.id] = name;
    console.log(`${name} joined the chat`);

    io.emit("join", name);
    io.emit("userList", Object.values(users));
  });

  // Handle text message
  socket.on("message", (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const fullMsg = { ...msg, time };
    messageHistory.push(fullMsg);
    io.emit("message", fullMsg);
  });

  // Handle image message
  socket.on("image", (data) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const fullData = { ...data, time };
    messageHistory.push(fullData);
    io.emit("image", fullData);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const name = users[socket.id];
    if (name) {
      console.log(`${name} disconnected`);
      delete users[socket.id];
      io.emit("leave", name);
      io.emit("userList", Object.values(users));
    }
  });
});

http.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
