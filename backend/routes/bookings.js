const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');

router.get('/', bookingsController.getBookings);
router.post('/check-availability', bookingsController.checkAvailability);
router.post('/', bookingsController.createBooking);
router.post('/:id/cancel', bookingsController.cancelBooking);

module.exports = router;
