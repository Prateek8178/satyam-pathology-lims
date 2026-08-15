const fs = require('fs');
const path = require('path');

const srcDir = 'd:/lab management system/server/src';
const controllersDir = path.join(srcDir, 'controllers');
const routesDir = path.join(srcDir, 'routes');

if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir, { recursive: true });
if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir, { recursive: true });

const controllers = ['auth', 'user', 'patient', 'doctor', 'test', 'testPackage', 'order', 'sample', 'lis', 'result', 'report', 'invoice', 'dashboard', 'settings', 'auditLog', 'appointment', 'homeCollection', 'inventory', 'notification'];
const routes = ['auth', 'users', 'patients', 'doctors', 'tests', 'packages', 'orders', 'samples', 'lis', 'results', 'reports', 'invoices', 'settings', 'auditLogs', 'dashboard', 'appointments', 'homeCollection', 'inventory', 'notifications', 'verify'];

// Route to controller mapping
const routeToController = {
  'auth': 'auth',
  'users': 'user',
  'patients': 'patient',
  'doctors': 'doctor',
  'tests': 'test',
  'packages': 'testPackage',
  'orders': 'order',
  'samples': 'sample',
  'lis': 'lis',
  'results': 'result',
  'reports': 'report',
  'invoices': 'invoice',
  'settings': 'settings',
  'auditLogs': 'auditLog',
  'dashboard': 'dashboard',
  'appointments': 'appointment',
  'homeCollection': 'homeCollection',
  'inventory': 'inventory',
  'notifications': 'notification',
  'verify': 'auth' // Mapping verify to auth or similar
};

const getControllerCode = (name) => {
  const Model = name.charAt(0).toUpperCase() + name.slice(1);
  return `const { createAuditLog } = require('../services/auditLogService');
const ${Model} = require('../models/${Model}');

const get${Model}s = async (req, res) => {
  try {
    const data = await ${Model}.find();
    res.status(200).json({ success: true, data, message: '${Model}s retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const get${Model}ById = async (req, res) => {
  try {
    const data = await ${Model}.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '${Model} not found' });
    res.status(200).json({ success: true, data, message: '${Model} retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create${Model} = async (req, res) => {
  try {
    const data = await ${Model}.create(req.body);
    if (createAuditLog) {
       await createAuditLog(req.user?.id, 'CREATE', '${Model}', data._id, req.body);
    }
    res.status(201).json({ success: true, data, message: '${Model} created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update${Model} = async (req, res) => {
  try {
    const data = await ${Model}.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ success: false, message: '${Model} not found' });
    if (createAuditLog) {
       await createAuditLog(req.user?.id, 'UPDATE', '${Model}', data._id, req.body);
    }
    res.status(200).json({ success: true, data, message: '${Model} updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const delete${Model} = async (req, res) => {
  try {
    const data = await ${Model}.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '${Model} not found' });
    if (createAuditLog) {
       await createAuditLog(req.user?.id, 'DELETE', '${Model}', data._id, null);
    }
    res.status(200).json({ success: true, data: {}, message: '${Model} deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  get${Model}s,
  get${Model}ById,
  create${Model},
  update${Model},
  delete${Model}
};
`;
};

const getRouteCode = (routeName, controllerName) => {
  const Model = controllerName.charAt(0).toUpperCase() + controllerName.slice(1);
  return `const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const {
  get${Model}s,
  get${Model}ById,
  create${Model},
  update${Model},
  delete${Model}
} = require('../controllers/' + '${controllerName}' + 'Controller');

router.use(verifyToken);

router.route('/')
  .get(authorize('admin', 'user'), get${Model}s)
  .post(authorize('admin'), create${Model});

router.route('/:id')
  .get(authorize('admin', 'user'), get${Model}ById)
  .put(authorize('admin'), update${Model})
  .delete(authorize('admin'), delete${Model});

module.exports = router;
`;
};

controllers.forEach(c => {
  fs.writeFileSync(path.join(controllersDir, c + 'Controller.js'), getControllerCode(c));
});

routes.forEach(r => {
  const ctrl = routeToController[r] || 'auth';
  fs.writeFileSync(path.join(routesDir, r + '.js'), getRouteCode(r, ctrl));
});

console.log('Done generating controllers and routes!');
