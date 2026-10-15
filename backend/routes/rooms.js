const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

router.get('/', roomsController.getRooms);
router.get('/:id', roomsController.getRoomById);
router.patch('/:id/amenities', roomsController.updateRoomAmenities);
router.put('/:id', roomsController.updateRoom);

module.exports = router;
