const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth, requireRole, ROLES } = require('../middleware/auth');

// User & access management is restricted to Super Admins
router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN));

router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
