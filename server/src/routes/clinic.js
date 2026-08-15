/**
 * Clinic Route
 * GET  /api/clinic/assets          → logo + signature URLs + settings (public for logged-in users)
 * POST /api/clinic/upload/:type    → SUPER_ADMIN only: upload logo or signature
 * PUT  /api/clinic/settings        → SUPER_ADMIN only: update name, address, phone, email, tagline
 */
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { verifyToken, authorize } = require('../middleware/auth');

const CLINIC_DIR      = path.join(__dirname, '../../uploads/clinic');
const SETTINGS_FILE   = path.join(CLINIC_DIR, 'settings.json');

// Ensure directory exists
if (!fs.existsSync(CLINIC_DIR)) fs.mkdirSync(CLINIC_DIR, { recursive: true });

// Default settings
const DEFAULT_SETTINGS = {
  name:    'SATYAM PATHOLOGY CENTER',
  tagline: 'Accurate | Caring | Instant',
  address: 'Inside Gopi Medical, Sheetla Mai Chauraha, Jabalpur',
  phone:   '9165144073, 9340311506, 9516128613',
  email:   'lp93403115@gmail.com',
};

const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
};

const writeSettings = (data) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
};

// Multer — image upload, max 5 MB
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CLINIC_DIR),
  filename:    (req, _file, cb) => {
    const type = req.params.type;
    cb(null, `${type}.png`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/image\/(jpeg|png|gif|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// All routes require login
router.use(verifyToken);

// ── GET /api/clinic/assets  (any logged-in user) ──────────────
router.get('/assets', (req, res) => {
  const logoExists = fs.existsSync(path.join(CLINIC_DIR, 'logo.png'));
  const sigExists  = fs.existsSync(path.join(CLINIC_DIR, 'signature.png'));
  const settings   = readSettings();
  res.json({
    success:   true,
    logo:      logoExists ? `/uploads/clinic/logo.png?t=${fs.statSync(path.join(CLINIC_DIR,'logo.png')).mtimeMs}`           : null,
    signature: sigExists  ? `/uploads/clinic/signature.png?t=${fs.statSync(path.join(CLINIC_DIR,'signature.png')).mtimeMs}` : null,
    settings,
  });
});

// ── POST /api/clinic/upload/:type  (SUPER_ADMIN only) ─────────
router.post('/upload/:type', authorize('SUPER_ADMIN'), upload.single('file'), (req, res) => {
  const { type } = req.params;
  if (!['logo', 'signature'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be logo or signature' });
  }
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = `/uploads/clinic/${type}.png?t=${Date.now()}`;
  res.json({ success: true, url, message: `${type} uploaded successfully` });
});

// ── PUT /api/clinic/settings  (SUPER_ADMIN only) ──────────────
router.put('/settings', authorize('SUPER_ADMIN'), (req, res) => {
  try {
    const current = readSettings();
    const updated = {
      name:    (req.body.name    || current.name).trim(),
      tagline: (req.body.tagline || current.tagline).trim(),
      address: (req.body.address || current.address).trim(),
      phone:   (req.body.phone   || current.phone).trim(),
      email:   (req.body.email   || current.email).trim(),
    };
    writeSettings(updated);
    res.json({ success: true, settings: updated, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
