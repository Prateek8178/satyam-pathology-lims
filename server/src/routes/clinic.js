/**
 * Clinic Route
 * GET  /api/clinic/assets          → logo + signature + settings (persistent from MongoDB)
 * POST /api/clinic/upload/:type    → SUPER_ADMIN only: upload logo or signature (saved persistently in MongoDB)
 * PUT  /api/clinic/settings        → SUPER_ADMIN only: update clinic & doctor details (saved in MongoDB)
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, authorize } = require('../middleware/auth');
const LabSettings = require('../models/LabSettings');

// Multer memory storage — keep file in memory buffer so we can convert to persistent Data URL in DB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/image\/(jpeg|png|gif|webp|svg\+xml)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (PNG, JPG, WEBP, SVG) are allowed'));
  },
});

// Helper to get or create settings singleton in MongoDB
const getOrCreateSettings = async () => {
  let settings = await LabSettings.findOne();
  if (!settings) {
    settings = await LabSettings.create({
      labName: 'SATYAM PATHOLOGY CENTER',
      tagline: 'Accurate | Caring | Instant',
      address: 'Inside Gopi Medical, Sheetla Mai Chauraha, Jabalpur',
      phone: '9165144073, 9340311506, 9516128613',
      customerSupport: '9165144073',
      email: 'lp93403115@gmail.com',
      doctorName: 'Dr. KHUSHBOO SHAH',
      doctorDegree: '(MD. Pathology)',
      disclaimer: 'Results of investigation depends upon test methods and instrument used. Interpretation may vary from lab to lab, our Pathology will not assume any liability for any controversy in interpretation or report. Claims if any are subject to Jabalpur (M.P.) Jurisdiction.',
      notes: 'Results of investigation depends upon test methods and instrument used. Interpretation may vary from lab to lab, our Pathology will not assume any liability for any controversy in interpretation or report. Claims if any are subject to Jabalpur (M.P.) Jurisdiction.'
    });
  }
  return settings;
};

// All routes require login
router.use(verifyToken);

// ── GET /api/clinic/assets  (any logged-in user) ──────────────
router.get('/assets', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      success: true,
      logo: settings.logo || null,
      signature: settings.signature || null,
      settings: {
        name: settings.labName,
        tagline: settings.tagline,
        address: settings.address,
        phone: settings.phone,
        customerSupport: settings.customerSupport || settings.phone,
        email: settings.email,
        doctorName: settings.doctorName || 'DR. R K SAGARIYA',
        doctorDegree: settings.doctorDegree || 'MD PATHOLOGY',
        disclaimer: settings.disclaimer,
        notes: settings.notes,
      },
    });
  } catch (err) {
    console.error('Error fetching clinic assets:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/clinic/upload/:type  (SUPER_ADMIN only) ─────────
router.post('/upload/:type', authorize('SUPER_ADMIN'), upload.single('file'), async (req, res) => {
  try {
    const { type } = req.params;
    if (!['logo', 'signature'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be logo or signature' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Convert uploaded image buffer to persistent Base64 Data URL
    const mimeType = req.file.mimetype || 'image/png';
    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const settings = await getOrCreateSettings();
    if (type === 'logo') {
      settings.logo = dataUrl;
    } else if (type === 'signature') {
      settings.signature = dataUrl;
      if (!settings.reportSettings) settings.reportSettings = {};
      settings.reportSettings.signature = dataUrl;
    }
    await settings.save();

    res.json({
      success: true,
      url: dataUrl,
      message: `${type === 'logo' ? 'Logo' : 'Signature'} saved persistently in database`
    });
  } catch (err) {
    console.error('Upload asset error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/clinic/settings  (SUPER_ADMIN only) ──────────────
router.put('/settings', authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const { name, tagline, address, phone, customerSupport, email, doctorName, doctorDegree, disclaimer, notes } = req.body;

    if (name !== undefined) settings.labName = name.trim();
    if (tagline !== undefined) settings.tagline = tagline.trim();
    if (address !== undefined) settings.address = address.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (customerSupport !== undefined) settings.customerSupport = customerSupport.trim();
    if (email !== undefined) settings.email = email.trim();
    if (doctorName !== undefined) settings.doctorName = doctorName.trim();
    if (doctorDegree !== undefined) settings.doctorDegree = doctorDegree.trim();
    if (disclaimer !== undefined) settings.disclaimer = disclaimer.trim();
    if (notes !== undefined) settings.notes = notes.trim();

    await settings.save();

    res.json({
      success: true,
      settings: {
        name: settings.labName,
        tagline: settings.tagline,
        address: settings.address,
        phone: settings.phone,
        customerSupport: settings.customerSupport,
        email: settings.email,
        doctorName: settings.doctorName,
        doctorDegree: settings.doctorDegree,
        disclaimer: settings.disclaimer,
        notes: settings.notes,
      },
      message: 'Clinic settings saved persistently'
    });
  } catch (err) {
    console.error('Save clinic settings error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
