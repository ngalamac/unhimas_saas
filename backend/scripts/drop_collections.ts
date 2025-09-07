import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined.');
    process.exit(1);
}

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
    const db = mongoose.connection.db;
    const toDrop = ['transactions', 'accounts'];
    for (const name of toDrop) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (exists) {
        console.log(`Dropping collection: ${name}`);
        await db.dropCollection(name);
      } else {
        console.log(`Collection not found, skipping: ${name}`);
      }
    }
    console.log('Done. Closing connection.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error dropping collections', err);
    process.exit(1);
  }
}

run();
