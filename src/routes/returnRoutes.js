const express = require('express');
const { createReturn } = require('../controllers/returnController');
const { validateRequestExists } = require('../middlewares/validation');
const router = express.Router();

router.post('/', validateRequestExists, createReturn);

module.exports = router;