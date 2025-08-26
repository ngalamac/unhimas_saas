import mongoose from 'mongoose';
import User from '../src/models/User';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://unhimas4:n673927826@cluster0.xeab0d2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function fixSuperadminRole() {
  await mongoose.connect(MONGO_URI);
  const result = await User.updateMany({ type: 'SuperAdmin' }, { $set: { role: 'superadmin' } });
  console.log('Updated superadmin users:', result.modifiedCount);
  await mongoose.disconnect();
}

fixSuperadminRole().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
