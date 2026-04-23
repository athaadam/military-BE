const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { validateUnitExists } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getUsers);
router.post('/', validateUnitExists, createUser);
router.put('/:id', validateUnitExists, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;