const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');
const { requireAuth, requireRole, FACILITY_ROLES } = require('../middleware/auth');

const canManage = [requireAuth, requireRole(...FACILITY_ROLES)];

router.get('/', roomsController.getRooms);
router.get('/:id', roomsController.getRoomById);
router.post('/', ...canManage, roomsController.createRoom);
router.patch('/:id/amenities', ...canManage, roomsController.updateRoomAmenities);
router.put('/:id', ...canManage, roomsController.updateRoom);
router.delete('/:id', ...canManage, roomsController.deleteRoom);

module.exports = router;
