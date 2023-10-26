import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express(); // Get the express app
const server = http.createServer(app); // Make the server from the app. Its HTTP server.
const io = new Server(server, {
  // Here we make the socket.io server and also bind the http server. So a box which contains both servers
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

export const getRecipientSocketId = (recipientId) => {
  // In msg controller, from the receiver id we call this so that get the socket id of the receiver
  return userSocketMap[recipientId]; // From map return the socket id of the receiver
};

const userSocketMap = {}; // userId: socketId

io.on("connection", (socket) => {
  // whenever the connection is established then the socket here and its for one time until the page refresh
  console.log("user connected", socket.id); // When user connect then get socket id
  const userId = socket.handshake.query.userId; // From the frontend whoever user req we also send his id in query that we are accepeted here

  if (userId != "undefined") userSocketMap[userId] = socket.id; // Add the user in map along with his socket id
  io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit the even for online users and map contains all the online users, here we just emit. client will  receive it

  socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
    try {
      await Message.updateMany(
        { conversationId: conversationId, seen: false },
        { $set: { seen: true } }
      );
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { "lastMessage.seen": true } }
      );
      io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    // Inside the io box, socket also check disconnect. When the user loggout or refresh then this trigger and del that user so that he dont show online and also emit the updated online user event
    console.log("user disconnected");
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };
