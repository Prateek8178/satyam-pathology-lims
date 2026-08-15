const User = require('../models/User');
const SavedReport = require('../models/SavedReport');

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ approvalStatus: 'pending', role: { $ne: 'SUPER_ADMIN' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'SUPER_ADMIN' } })
      .select('fullName email username role approvalStatus isActive lastLogin createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.approvalStatus = 'approved';
    user.isActive = true;
    await user.save();
    
    res.json({ success: true, message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.approvalStatus = 'rejected';
    user.isActive = false;
    await user.save();
    
    res.json({ success: true, message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot delete Super Admin' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllReportLogs = async (req, res) => {
  try {
    const reports = await SavedReport.find()
      .populate('patient', 'fullName patientId')
      .populate('createdBy', 'fullName email username')
      .sort({ createdAt: -1 })
      .limit(200);
      
    const count = await SavedReport.countDocuments();
    
    res.json({ success: true, data: reports, total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'SUPER_ADMIN' } });
    const pendingUsers = await User.countDocuments({ approvalStatus: 'pending', role: { $ne: 'SUPER_ADMIN' } });
    const approvedUsers = await User.countDocuments({ approvalStatus: 'approved', role: { $ne: 'SUPER_ADMIN' } });
    
    const totalReports = await SavedReport.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReports = await SavedReport.countDocuments({ createdAt: { $gte: today } });
    
    const recentReports = await SavedReport.find()
      .populate('patient', 'fullName patientId')
      .populate('createdBy', 'fullName email username')
      .sort({ createdAt: -1 })
      .limit(5);
      
    res.json({
      success: true,
      data: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        totalReports,
        todayReports,
        recentReports
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'Cannot modify Super Admin' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    // Recent registrations (last 7 days)
    const since = new Date(); since.setDate(since.getDate() - 7);
    const newUsers = await User.find({ createdAt: { $gte: since }, role: { $ne: 'SUPER_ADMIN' } })
      .select('fullName email username approvalStatus createdAt').sort({ createdAt: -1 }).limit(20);

    // Pending approvals count
    const pendingCount = await User.countDocuments({ approvalStatus: 'pending', role: { $ne: 'SUPER_ADMIN' } });

    // Reports today
    const today = new Date(); today.setHours(0,0,0,0);
    const todayReports = await SavedReport.find({ createdAt: { $gte: today } })
      .populate('patient', 'fullName').populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 }).limit(10);

    const notifications = [];

    // Pending user notifications
    newUsers.filter(u => u.approvalStatus === 'pending').forEach(u => {
      notifications.push({
        id: `reg-${u._id}`, type: 'registration', icon: '👤',
        title: 'New Registration',
        message: `${u.fullName} (${u.username}) has requested access`,
        time: u.createdAt, action: 'pending', userId: u._id,
      });
    });

    // Report notifications
    todayReports.forEach(r => {
      notifications.push({
        id: `rep-${r._id}`, type: 'report', icon: '🧾',
        title: 'Report Generated',
        message: `${r.reportNo || 'Report'} — Patient: ${r.patient?.fullName || 'Unknown'} — By: ${r.createdBy?.fullName || 'Unknown'}`,
        time: r.createdAt, action: null,
      });
    });

    // Sort all by time desc
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ success: true, data: notifications, pendingCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  deleteUser,
  toggleUserActive,
  getAllReportLogs,
  getDashboardStats,
  getNotifications,
};
