const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/summary', analyticsController.getDashboardSummary);
router.get('/reports', analyticsController.getReports);

module.exports = router;

