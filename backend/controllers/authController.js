const User = require('../models/user');
const redisClient = require('../utils/redisClient');
const bcrypt = require('bcryptjs');


exports.redisUser = async (req, res) => {
  try {
    const userData = req.body;
     const existingByEmail = await redisClient.exists(`tempUser:${userData.email}`);
    const existingByMobile = await redisClient.exists(`tempUserMobile:${userData.mobile}`);

    if (existingByEmail || existingByMobile) {
      return res.status(409).json({ error: 'Temporary user already exists' });
    }
    await redisClient.set(`tempUser:${userData.email}`, JSON.stringify(userData), { EX:300 }); 
    await redisClient.set(`tempUserMobile:${userData.mobile}`, JSON.stringify(userData), { EX: 300 });

    res.json({ message: 'User data saved temporarily' });
    console.log('Temporary user data:', userData);
  } catch (err) {
    console.error('Save temp user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.registration = async (req, res) => {
  try {
    const { email } = req.body;
    const tempUserData = await redisClient.get(`tempUser:${email}`);
    if (!tempUserData) {
      return res.status(400).json({ error: 'No temporary user data found or expired' });
    }

   const userData = JSON.parse(tempUserData);

   
   const existingUser = await User.findOne({ email: userData.email });
   console.log("no user:",existingUser);

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email  already exists' });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      mobile: userData.mobile,
      email: userData.email,
      loginId: userData.loginId,
      password: hashedPassword,
      address: {
        street: userData.street || '',
        city: userData.city || '',
        state: userData.state || '',
        country: userData.country || ''
      }
    });

    await newUser.save();
        console.log('New user saved:', newUser);


    
    await redisClient.del(`tempUser:${email}`);
    await redisClient.del(`tempUserMobile:${userData.mobile}`);
    await redisClient.del(`mobile:${userData.mobile}`);
    await redisClient.del(`email:${email}`);
    if (req.io) {
      console.log("Emitting userRegistered after registration for:", newUser.email);
      req.io.emit("userRegistered", {
       
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        mobile: newUser.mobile,
        loginId: newUser.loginId,
        address: newUser.address,
        creationTime: newUser.createdAt,
      });
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Finalize registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Email or Password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Email or Password' });
    }
    
    console.log('Login successful for:', email);
    if (req.io) {
    req.io.emit('userLoggedIn', {
     
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        loginId: user.loginId,
        address: user.address,
        creationTime: user.createdAt, // socketId assigned on socket joinLive event
    });
  }
   
    res.json({
      
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      loginId: user.loginId,

      address: user.address,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -__v').lean();
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Find the user in DB to emit proper object
    const user = await User.findOne({ email }).select("-password -__v");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If you're managing liveUsers in memory:
    if (typeof liveUsers !== "undefined") {
      const socketEntry = Array.from(liveUsers.entries()).find(
        ([, u]) => u.email === email
      );
      if (socketEntry) {
        const [socketId] = socketEntry;
        liveUsers.delete(socketId);

        // Emit updated live users list to all clients
        req.io.to("live_users").emit(
          "updateLiveUsers",
          Array.from(liveUsers.values())
        );
        req.io.to("admin_room").emit(
          "updateLiveUsers",
          Array.from(liveUsers.values())
        );
      }
    }

    // 🔹 Explicitly tell frontend which user logged out
    req.io.emit("userLoggedOut", {
     
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      loginId: user.loginId,
      address: user.address,
      creationTime: user.createdAt,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

