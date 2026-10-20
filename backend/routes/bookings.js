const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

// The calendar is viewable without signing in (confidential meetings are masked)
router.get('/', optionalAuth, bookingsController.getBookings);
router.post('/check-availability', bookingsController.checkAvailability);
router.post('/', requireAuth, bookingsController.createBooking);
router.post('/:id/cancel', requireAuth, bookingsController.cancelBooking);
router.put('/:id/cancel', requireAuth, bookingsController.cancelBooking);

module.exports = router;
