const otpGenerator = require('otp-generator');
const redisClient = require('../utils/redisClient');

exports.sendOtp = async (req, res) => {
 
  try {
    const { contact, type } = req.body; 
    if (!contact || !['mobile', 'email'].includes(type)) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    await redisClient.setEx(`${type}:${contact}`, 600, otp);

    if (type === 'email') {
      await sendMail(contact, "Your OTP Code", `Your OTP code is: ${otp}`);
    }
  
    
    res.json({ message: `OTP sent to your ${type}`, otp });

  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { contact, type, otp } = req.body;

    if (!contact || !otp || !['mobile', 'email'].includes(type)) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const storedOtp = await redisClient.get(`${type}:${contact}`);
    if (storedOtp === otp) {
      return res.json({ verified: true });
    } else {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
