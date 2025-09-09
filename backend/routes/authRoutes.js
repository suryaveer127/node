const express = require('express');
const router = express.Router();
const { redisUser, registration, login, getAllUsers ,logout} = require('../controllers/authController');

router.post('/register-temp', redisUser);
router.post('/register-final', registration);
router.post('/login', login);
router.post('/logout',logout);
router.get('/users', getAllUsers);

module.exports = router;
