const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');
router.use(verifyToken);
router.get('/stats', ctrl.getStats);
router.get('/charts', ctrl.getChartData);
module.exports = router;
