const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/auditLogController');
router.use(verifyToken);
router.get('/', authorize('SUPER_ADMIN'), ctrl.getAll);
router.get('/entity/:entity/:entityId', authorize('SUPER_ADMIN'), ctrl.getByEntity);
module.exports = router;
