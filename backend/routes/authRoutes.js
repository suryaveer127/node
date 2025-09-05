const express = require('express');
const router = express.Router();
const { redisUser, registration, login, getAllUsers } = require('../controllers/authController');

router.post('/register-temp', redisUser);
router.post('/register-final', registration);
router.post('/login', login);
router.get('/users', getAllUsers);

module.exports = router;
