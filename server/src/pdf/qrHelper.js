const QRCode = require('qrcode');
const generateQRDataURL = async (reportId, baseUrl = 'http://localhost:5173') => await QRCode.toDataURL(`${baseUrl}/verify-report/${reportId}`, { width: 100, margin: 1 });
const getQRBuffer = async (reportId, baseUrl = 'http://localhost:5173') => await QRCode.toBuffer(`${baseUrl}/verify-report/${reportId}`, { width: 100, margin: 1 });
module.exports = { generateQRDataURL, getQRBuffer };
