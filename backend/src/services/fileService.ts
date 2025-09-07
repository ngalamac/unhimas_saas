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
    try {
        await bucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (error: any) {
        // If the file doesn't exist, GridFS throws an error. We can ignore this.
        if (error.code === 'ENOENT') {
            return;
        }
        console.error(`Failed to delete file ${fileId} from GridFS:`, error);
    }
};
