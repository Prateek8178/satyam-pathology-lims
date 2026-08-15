// MOCK NOTIFICATION PROVIDER
// TODO: Replace with real SMS/Email/WhatsApp provider when credentials are available
// Supported channels: EMAIL (configure SMTP), SMS (configure Twilio/MSG91), WHATSAPP (configure Meta API)

const Notification = require('../models/Notification');

const send = async (patientId, type, message, channel = 'SMS') => {
  try {
    const notification = await Notification.create({
      patient: patientId,
      type,
      message,
      channel,
      status: 'PENDING'
    });
    // MOCK: Simulate sending
    console.log(`[MOCK NOTIFICATION] Channel: ${channel}, Type: ${type}, Message: ${message}`);
    notification.status = 'SENT';
    notification.sentAt = new Date();
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = { send };
