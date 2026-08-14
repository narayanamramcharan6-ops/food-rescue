/**
 * Seed script – creates the default admin user
 * Run: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'narayanamramcharan6@gmail.com';
const ADMIN_PASSWORD = 'Amma@1234';
const ADMIN_NAME = 'Narayana Ramcharan';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      // Update to ensure role is admin and password is correct
      existing.role = 'admin';
      existing.password = ADMIN_PASSWORD; // will be hashed by pre-save hook
      existing.name = ADMIN_NAME;
      existing.isActive = true;
      await existing.save();
      console.log('✅ Admin user updated successfully');
      console.log(`   Email   : ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Admin user created successfully');
      console.log(`   Email   : ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
