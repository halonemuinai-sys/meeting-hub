const express = require('express');
const router = express.Router();
const attendeesController = require('../controllers/attendeesController');

router.get('/', attendeesController.getAttendees);
router.post('/', attendeesController.createAttendee);
router.put('/:id', attendeesController.updateAttendee);
router.delete('/:id', attendeesController.deleteAttendee);

module.exports = router;
