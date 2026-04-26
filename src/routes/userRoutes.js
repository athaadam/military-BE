const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { validateUnitExists, validateUserInput } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getUsers);
router.post('/', validateUserInput, validateUnitExists, createUser);
router.put('/:id', validateUserInput, validateUnitExists, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;