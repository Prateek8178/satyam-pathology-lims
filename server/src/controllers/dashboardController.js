const Patient = require('../models/Patient');
const Order = require('../models/Order');
const Sample = require('../models/Sample');
const LISResult = require('../models/LISResult');
const Result = require('../models/Result');
const Report = require('../models/Report');
const Payment = require('../models/Payment');

const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayPatients, todayOrders, pendingSamples, collectedSamples, lisResultsToday,
           unmatchedLIS, pendingVerification, reportsGenerated, abnormalResults, criticalResults,
           todayRevenue, monthRevenue] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Order.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Sample.countDocuments({ status: 'PENDING' }),
      Sample.countDocuments({ status: 'COLLECTED' }),
      LISResult.countDocuments({ receivedAt: { $gte: today, $lte: todayEnd } }),
      LISResult.countDocuments({ matchingStatus: 'UNMATCHED' }),
      Result.countDocuments({ status: 'VERIFICATION_PENDING' }),
      Report.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Result.countDocuments({ 'parameterResults.flag': { $in: ['HIGH', 'LOW', 'ABNORMAL'] } }),
      Result.countDocuments({ 'parameterResults.flag': 'CRITICAL' }),
      Payment.aggregate([{ $match: { receivedAt: { $gte: today, $lte: todayEnd }, isRefund: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { receivedAt: { $gte: monthStart }, isRefund: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    res.json({
      success: true,
      data: {
        todayPatients, todayOrders, pendingSamples, collectedSamples,
        lisResultsToday, unmatchedLIS, pendingVerification, reportsGenerated,
        abnormalResults, criticalResults,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChartData = async (req, res) => {
  try {
    const now = new Date();
    // Last 14 days patient counts
    const dailyData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
      const count = await Patient.countDocuments({ createdAt: { $gte: d, $lte: dEnd } });
      dailyData.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), count });
    }

    // Last 6 months revenue
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const result = await Payment.aggregate([{ $match: { receivedAt: { $gte: mStart, $lte: mEnd }, isRefund: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
      monthlyRevenue.push({ month: mStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), revenue: result[0]?.total || 0 });
    }

    // Top 5 tests
    const topTests = await Order.aggregate([
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.type': 'test' } },
      { $group: { _id: '$orderItems.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({ success: true, data: { dailyPatients: dailyData, monthlyRevenue, topTests } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getChartData };
