require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const updateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for user update');

    const result = await User.updateMany(
      { role: { $ne: 'SUPER_ADMIN' }, approvalStatus: { $exists: false } },
      { $set: { approvalStatus: 'approved' } }
    );
    
    // Also update any pending ones to approved if this is meant for all existing
    const result2 = await User.updateMany(
      { role: { $ne: 'SUPER_ADMIN' } },
      { $set: { approvalStatus: 'approved' } }
    );
    
    console.log(`Updated existing users to approved status. Result:`, result, result2);
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
};

updateUsers();
