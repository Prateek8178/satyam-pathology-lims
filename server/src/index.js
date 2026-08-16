require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Required for Render/Heroku — fixes rate limiter behind proxy

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
    ].filter(Boolean);
    // Allow any vercel.app subdomain
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'LIMS API is running', timestamp: new Date() }));

// Mount empty routers for now to prevent startup crash if subagents are not done
const dummyRouter = express.Router();
dummyRouter.all('*', (req, res) => res.status(501).json({ message: 'Not Implemented Yet' }));
const getRouter = (routePath) => {
  try {
    const routerPath = path.join(__dirname, 'routes', routePath + '.js');
    if (fs.existsSync(routerPath)) return require(routerPath);
    return dummyRouter;
  } catch (err) {
    return dummyRouter;
  }
};

app.use('/api/auth', getRouter('auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', getRouter('users'));
app.use('/api/patients', getRouter('patients'));
app.use('/api/doctors', getRouter('doctors'));
app.use('/api/tests', getRouter('tests'));
app.use('/api/packages', getRouter('packages'));
app.use('/api/orders', getRouter('orders'));
app.use('/api/samples', getRouter('samples'));
app.use('/api/lis', getRouter('lis'));
app.use('/api/results', getRouter('results'));
app.use('/api/reports', getRouter('reports'));
app.use('/api/invoices', getRouter('invoices'));
app.use('/api/settings', getRouter('settings'));
app.use('/api/audit-logs', getRouter('auditLogs'));
app.use('/api/dashboard', getRouter('dashboard'));
app.use('/api/appointments', getRouter('appointments'));
app.use('/api/home-collection', getRouter('homeCollection'));
app.use('/api/inventory', getRouter('inventory'));
app.use('/api/notifications', getRouter('notifications'));
app.use('/api/verify-report', getRouter('verify'));
app.use('/api/saved-reports', require('./routes/savedReports'));
app.use('/api/clinic', require('./routes/clinic'));

['uploads', 'uploads/reports', 'uploads/logos'].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

app.use(errorHandler);


const PORT = process.env.PORT || 5000;

// ── Start server FIRST (so Render health check passes immediately) ──
app.listen(PORT, () => {
  console.log(`🚀 LIMS Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);

  // Connect to MongoDB after server is listening
  connectDB().then(() => {
    console.log('📦 Database connected and ready');
    try {
      const LISManager = require('./integrations/lis/LISManager');
      LISManager.start();
      console.log('🔬 LIS Manager started');
    } catch (err) {
      console.warn('⚠️ LIS Manager failed to start:', err.message);
    }
  }).catch(err => {
    console.error('❌ Database connection failed:', err.message);
    // Don't exit — keep server running so health check passes
    // Requests will fail gracefully until DB reconnects
  });
});

module.exports = app;
