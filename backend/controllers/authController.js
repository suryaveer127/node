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

    
    await redisClient.del(`tempUser:${email}`);
    await redisClient.del(`tempUserMobile:${userData.mobile}`);
    await redisClient.del(`mobile:${userData.mobile}`);
    await redisClient.del(`email:${email}`);

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
    res.json({
      id: user._id,
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
