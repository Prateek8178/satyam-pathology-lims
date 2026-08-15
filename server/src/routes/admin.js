const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(verifyToken, authorize('SUPER_ADMIN'));

router.get('/dashboard',           ctrl.getDashboardStats);
router.get('/notifications',       ctrl.getNotifications);
router.get('/users',               ctrl.getAllUsers);
router.get('/users/pending',       ctrl.getPendingUsers);
router.put('/users/:id/approve',   ctrl.approveUser);
router.put('/users/:id/reject',    ctrl.rejectUser);
router.put('/users/:id/toggle',    ctrl.toggleUserActive);
router.delete('/users/:id',        ctrl.deleteUser);
router.get('/reports',             ctrl.getAllReportLogs);

module.exports = router;
