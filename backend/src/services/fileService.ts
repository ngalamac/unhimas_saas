import mongoose from 'mongoose';

export const deleteFileFromGridFS = async (fileId: string) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return; // Not a valid GridFS id
    }

    const db = mongoose.connection.db;
    if (!db) {
        console.error('Database not initialized, cannot delete file from GridFS');
        return;
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const filesColl = db.collection('uploads.files');
    const objectId = new mongoose.Types.ObjectId(fileId);

    try {
        await bucket.delete(objectId);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error(`Failed to delete file ${fileId} from GridFS:`, error);
        }
    }

    // Also delete the thumbnail
    try {
        const thumbnail = await filesColl.findOne({ 'metadata.originalFileId': fileId });
        if (thumbnail) {
            await bucket.delete(thumbnail._id);
        }
    } catch (error) {
        console.error(`Failed to delete thumbnail for file ${fileId}:`, error);
    }
};
