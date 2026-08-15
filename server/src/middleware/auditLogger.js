const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ user, role, action, entity, entityId, oldValue, newValue, ip }) => {
  try {
    await AuditLog.create({
      user: user?._id || user,
      role: role || user?.role,
      action,
      entity,
      entityId: entityId ? entityId.toString() : undefined,
      oldValue,
      newValue,
      ipAddress: ip,
      timestamp: new Date()
    });
  } catch (err) {
    // Don't crash app if audit log fails
    console.error('[AuditLog] Error:', err.message);
  }
};

module.exports = { createAuditLog };
