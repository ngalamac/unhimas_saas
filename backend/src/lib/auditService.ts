import Audit from '../models/Audit';
import mongoose from 'mongoose';

interface AuditLog {
    user: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    entityId: mongoose.Types.ObjectId;
    changes?: { before: any; after: any };
    branch?: mongoose.Types.ObjectId;
    ipAddress?: string;
    details?: string;
}

export const logAuditEvent = async (log: AuditLog) => {
    try {
        const audit = new Audit({
            ...log,
            timestamp: new Date(),
        });
        await audit.save();
    } catch (error) {
        console.error('Failed to log audit event:', {
            message: (error as Error).message,
            stack: (error as Error).stack,
            log,
        });
    }
};
