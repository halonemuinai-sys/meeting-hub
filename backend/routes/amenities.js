const express = require('express');
const router = express.Router();
const amenitiesController = require('../controllers/amenitiesController');
const { requireAuth, requireRole, FACILITY_ROLES } = require('../middleware/auth');

const canManage = [requireAuth, requireRole(...FACILITY_ROLES)];

router.get('/', requireAuth, amenitiesController.getAmenities);
router.post('/', ...canManage, amenitiesController.createAmenity);
router.delete('/', ...canManage, amenitiesController.deleteAllAmenities);
router.delete('/all', ...canManage, amenitiesController.deleteAllAmenities);
router.put('/:id', ...canManage, amenitiesController.updateAmenity);
router.delete('/:id', ...canManage, amenitiesController.deleteAmenity);

module.exports = router;
