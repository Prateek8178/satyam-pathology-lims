require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedSuperAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in env variables');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    const email = 'sahunitesh971@gmail.com';
    const password = 'Nitesh@1811';
    
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('Super Admin found, updating password & fields...');
      user.password = password; // pre-save hook will hash it
      user.fullName = 'Nitesh Sahu';
      user.username = 'niteshsahu';
      user.role = 'SUPER_ADMIN';
      user.approvalStatus = 'approved';
      user.isActive = true;
      await user.save();
      console.log('Super Admin updated successfully!');
    } else {
      console.log('Creating new Super Admin...');
      const newUser = new User({
        email,
        password,
        fullName: 'Nitesh Sahu',
        username: 'niteshsahu',
        role: 'SUPER_ADMIN',
        approvalStatus: 'approved',
        isActive: true
      });
      await newUser.save();
      console.log('Super Admin created successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
