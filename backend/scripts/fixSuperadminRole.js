// Run this script with: node backend/scripts/fixSuperadminRole.js
const mongoose = require('mongoose');
const User = require('../src/models/User').default;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unhimas_saas';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const result = await User.updateMany({ type: 'SuperAdmin' }, { $set: { role: 'superadmin' } });
    console.log('Updated superadmin users:', result.modifiedCount);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
