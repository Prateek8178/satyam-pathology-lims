const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/savedReportController');

const REPORT_ROLES = ['LAB_TECHNICIAN', 'LAB_ADMIN', 'SUPER_ADMIN'];

router.use(verifyToken);
router.get('/', ctrl.getAll);
router.post('/', authorize(...REPORT_ROLES), ctrl.create);   // ← Only authorized roles
router.get('/:id', ctrl.getById);
router.delete('/:id', authorize(...REPORT_ROLES), ctrl.deleteReport);
module.exports = router;

