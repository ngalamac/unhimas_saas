// Script to normalize all user permission keys to lowercase in MongoDB
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unhimas';

async function normalizePermissions() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find();
  for (const user of users) {
    if (user.permissions && typeof user.permissions === 'object') {
      const newPermissions = {};
      for (const key of Object.keys(user.permissions)) {
        newPermissions[key.toLowerCase()] = user.permissions[key];
      }
      user.permissions = newPermissions;
      await user.save();
      console.log(`Normalized permissions for user: ${user.email}`);
    }
  }
  mongoose.disconnect();
  console.log('Done normalizing permissions.');
}

normalizePermissions();
