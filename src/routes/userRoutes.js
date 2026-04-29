const express = require('express');
const { getUsers, getUser, createUser, updateUser, deleteUser, resetPassword } = require('../controllers/userController');
const { validateUnitExists, validateUserInput } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', validateUserInput, validateUnitExists, createUser);
router.post('/:id/reset-password', resetPassword);
router.put('/:id', validateUserInput, validateUnitExists, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;