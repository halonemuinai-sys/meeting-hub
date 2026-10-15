const express = require('express');
const router = express.Router();
const amenitiesController = require('../controllers/amenitiesController');

router.get('/', amenitiesController.getAmenities);
router.post('/', amenitiesController.createAmenity);
router.put('/:id', amenitiesController.updateAmenity);
router.delete('/:id', amenitiesController.deleteAmenity);

module.exports = router;
