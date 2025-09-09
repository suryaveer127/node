require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' } 
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);

// Add io to req if needed in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

let liveUsers = new Map(); // socket.id => userData

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins live room
  socket.on("joinLive", (userData) => {
    liveUsers.set(socket.id, {
      _id: userData._id,
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName}`,
      socketId: socket.id
    });
    socket.join("live_users");

    // Broadcast updated live users
    io.to("live_users").emit("updateLiveUsers", Array.from(liveUsers.values()));
    io.to("admin_room").emit("updateLiveUsers", Array.from(liveUsers.values()));

    // Notify all clients that a user logged in
    io.emit("userLoggedIn", liveUsers.get(socket.id));
  });

  // Admin room
  socket.on("joinAdmin", () => {
    socket.join("admin_room");
    socket.emit("updateLiveUsers", Array.from(liveUsers.values()));
  });

  // Disconnect
socket.on("disconnect", () => {
  const disconnectedUser = liveUsers.get(socket.id);
  liveUsers.delete(socket.id);

  // Update live users for everyone in "live_users" room
  io.to("live_users").emit("updateLiveUsers", Array.from(liveUsers.values()));

  // Notify other users that this specific user logged out
  // Use a broadcast so the user themselves doesn't receive it
  if (disconnectedUser) {
    socket.broadcast.to("live_users").emit("userLoggedOut", disconnectedUser);
  }
});

});

// Serve frontend if needed
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
});

server.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port', process.env.PORT || 5000);
});
