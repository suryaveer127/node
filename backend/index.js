// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const http = require('http');
// const cors = require('cors');
// const { Server } = require('socket.io');

// const authRoutes = require('./routes/authRoutes');
// const otpRoutes = require('./routes/otpRoutes');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

// app.use(cors({ origin: 'http://localhost:5173' }));
// app.use(express.json());

// app.use('/api/auth', authRoutes);
// app.use('/api/otp', otpRoutes);

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Use a Map to track live users by socket.id
// let liveUsers = new Map();

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // User joins live users room
//   socket.on("joinLive", (userData) => {
//     liveUsers.set(socket.id, {
//       email: userData.email,
//       name: userData.name,
//       socketId: socket.id
//     });
//     socket.join("live_users");

//     // Broadcast updated live users to both live users and admins
//     io.to("live_users").emit("updateLiveUsers", Array.from(liveUsers.values()));
//     io.to("admin_room").emit("updateLiveUsers", Array.from(liveUsers.values()));
//   });

//   // Admin joins admin room
//   socket.on("joinAdmin", () => {
//     console.log(`Admin joined: ${socket.id}`);
//     socket.join("admin_room");

//     // Send current live users list immediately
//     socket.emit("updateLiveUsers", Array.from(liveUsers.values()));
//   });

//   // User requests current live users (optional)
//   socket.on("requestLive", () => {
//     socket.emit("updateLiveUsers", Array.from(liveUsers.values()));
//   });

//   socket.on("disconnect", () => {
//     console.log('User disconnected:', socket.id);
//     liveUsers.delete(socket.id);

//     // Broadcast updated live users to both live users and admins
//     io.to("live_users").emit("updateLiveUsers", Array.from(liveUsers.values()));
//     io.to("admin_room").emit("updateLiveUsers", Array.from(liveUsers.values()));
//   });
// });

// server.listen(process.env.PORT || 5000, () => {
//   console.log('Server running on port', process.env.PORT || 5000);
// });
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // allow all origins for Render
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use a Map to track live users by socket.id
let liveUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins live users room
  socket.on("joinLive", (userData) => {
    liveUsers.set(socket.id, {
      email: userData.email,
      name: userData.name,
      socketId: socket.id
    });
    socket.join("live_users");

    // Broadcast updated live users to both live users and admins
    io.to("live_users").emit("updateLiveUsers", Array.from(liveUsers.values()));
    io.to("admin_room").emit("updateLiveUsers", Array.from(liveUsers.values()));
  });

  // Admin joins admin room
  socket.on("joinAdmin", () => {
    console.log(`Admin joined: ${socket.id}`);
    socket.join("admin_room");

    // Send current live users list immediately
    socket.emit("updateLiveUsers", Array.from(liveUsers.values()));
  });

  // User requests current live users (optional)
  socket.on("requestLive", () => {
    socket.emit("updateLiveUsers", Array.from(liveUsers.values()));
  });

  socket.on("disconnect", () => {
    console.log('User disconnected:', socket.id);
    liveUsers.delete(socket.id);

 
    io.to("live_users").emit("updateLiveUsers", Array.from(liveUsers.values()));
    io.to("admin_room").emit("updateLiveUsers", Array.from(liveUsers.values()));
  });
});
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});



server.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port', process.env.PORT || 5000);
});
