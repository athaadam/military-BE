const express = require('express');
const { login, register, me } = require('../controllers/authController');
const { auth } = require('../middlewares/auth');
const { validateUnitExists } = require('../middlewares/validation');
const router = express.Router();

router.post('/login', login);
router.post('/register', validateUnitExists, register);
router.get('/me', auth, me);

module.exports = router;