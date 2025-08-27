#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://unhimas4:n673927826@cluster0.xeab0d2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.error('Uploads directory not found:', uploadsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());
  console.log(`Found ${files.length} files in ${uploadsDir}`);

  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');

  for (const fileName of files) {
    try {
      console.log('Uploading', fileName);
      const filePath = path.join(uploadsDir, fileName);
      const readStream = fs.createReadStream(filePath);
      const uploadStream = bucket.openUploadStream(fileName, { metadata: { migratedFromDisk: true } });
      await new Promise((resolve, reject) => {
        readStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });
      const fileId = uploadStream.id.toString();
      const newUrl = `/api/uploads/file/${fileId}`;
      // Update students pointing to this filename or path
      const queryVariants = [
        { profilePicture: fileName },
        { profilePicture: `/uploads/${fileName}` },
        { profilePicture: { $regex: fileName } },
      ];
      const updateResult = await Student.updateMany(
        { $or: queryVariants },
        { $set: { profilePicture: newUrl } }
      );
      console.log(`Uploaded ${fileName} -> id=${fileId}. Matched ${updateResult.matchedCount} documents, modified ${updateResult.modifiedCount}`);
    } catch (err) {
      console.error('Failed migrating', fileName, err && err.message ? err.message : err);
    }
  }

  console.log('Migration finished. You may remove disk files after verifying DB-served images work.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
