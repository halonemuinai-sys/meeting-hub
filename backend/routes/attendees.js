const express = require('express');
const router = express.Router();
const attendeesController = require('../controllers/attendeesController');
const { requireAuth, requireRole, FACILITY_ROLES } = require('../middleware/auth');

const canManage = [requireAuth, requireRole(...FACILITY_ROLES)];

router.get('/', requireAuth, attendeesController.getAttendees);
router.post('/', ...canManage, attendeesController.createAttendee);
router.put('/:id', ...canManage, attendeesController.updateAttendee);
router.delete('/:id', ...canManage, attendeesController.deleteAttendee);

module.exports = router;
