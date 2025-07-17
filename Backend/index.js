import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import cors from 'cors'; // Enable CORS for cross-origin requests

const app = express();
app.use(cors()); // Allow requests from different origins

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from any origin (adjust as needed for production)
  },
});

const rooms = new Map(); // Stores roomId -> Set of userNames

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on('join', ({ roomId, userName }) => {
    // If the user was in another room, leave it first
    if (currentRoom && currentUser) {
      const prevRoomUsers = rooms.get(currentRoom);
      if (prevRoomUsers) {
        prevRoomUsers.delete(currentUser);
        if (prevRoomUsers.size === 0) {
          rooms.delete(currentRoom); // Delete room if no users are left
        } else {
          io.to(currentRoom).emit('userJoined', Array.from(prevRoomUsers));
        }
      }
      socket.leave(currentRoom);
    }

    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);
    // Emit updated user list to all in the room
    io.to(roomId).emit('userJoined', Array.from(rooms.get(roomId)));
    console.log(`${userName} joined room: ${roomId}`);
  });

  socket.on('codechange', ({ roomId, code }) => {
    // Broadcast code changes to all others in the room
    socket.to(roomId).emit('codeupdate', code);
  });

  socket.on('leaveRoom', () => {
    if (currentRoom && currentUser) {
      const roomUsers = rooms.get(currentRoom);
      if (roomUsers) {
        roomUsers.delete(currentUser);
        if (roomUsers.size === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit('userJoined', Array.from(roomUsers));
        }
      }
      socket.leave(currentRoom);
      console.log(`${currentUser} left room: ${currentRoom}`);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on('typing', ({ roomId, userName }) => {
    // Broadcast typing indicator to all others in the room
    socket.to(roomId).emit('userTyping', userName);
  });

  socket.on('languagechange', ({ roomId, language }) => {
    // Broadcast language change to all in the room
    io.to(roomId).emit('languageupdate', language);
  });

  socket.on('compilecode', async ({ code, roomId, language, version }) => {
    try {
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language,
          version,
          files: [{ content: code }],
        }
      );

      const output = response.data.run?.output || "No output returned";
      io.to(roomId).emit('codeResponse', { output });
    } catch (error) {
      console.error('Error compiling code:', error.message);
      // More detailed error handling for API issues
      let errorMessage = 'Error: Unable to compile code. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      }
      io.to(roomId).emit('codeResponse', { output: errorMessage });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (currentRoom && currentUser) {
      const roomUsers = rooms.get(currentRoom);
      if (roomUsers) {
        roomUsers.delete(currentUser);
        if (roomUsers.size === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit('userJoined', Array.from(roomUsers));
        }
      }
    }
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});