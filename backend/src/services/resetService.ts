import mongoose from 'mongoose';

export type ResetMode = 'soft' | 'hard';

export interface ResetOptions {
  mode: ResetMode;
  dryRun?: boolean;
  includeGridfs?: boolean;
  preserveEmails?: string[];
}

export interface ResetSummaryEntry {
  action: string;
  matched?: number;
  deleted?: number;
}

export interface ResetResult {
  mode: ResetMode;
  dryRun: boolean;
  includeGridfs: boolean;
  preservedUsers: string[];
  summary: Record<string, ResetSummaryEntry>;
}

function isSystemCollection(name: string): boolean {
  return name.startsWith('system.');
}

function isGridFsCollection(name: string): boolean {
  return name === 'uploads.files' || name === 'uploads.chunks';
}

function buildSoftFilterForCollection(name: string) {
  const testRegex = /test|smoke|sample|dummy|fixture|lifecycle|to(update|delete)|stud/iu;
  const emailTestRegex = /(@test\.com$)|(@example\.com$)|(@branch\.test$)|(^smoke@)|(^tuition-smoke@)/iu;

  const or: any[] = [];

  if (name === 'users') {
    or.push({ email: { $regex: emailTestRegex } });
    or.push({ name: { $regex: testRegex } });
    return { $or: or };
  }

  if (name === 'uploads.files') {
    return { 'metadata.originalname': { $regex: testRegex } };
  }

  const commonFields = [
    'name',
    'code',
    'title',
    'description',
    'email',
    'address',
    'type',
    'nationalIdName',
    'guardian.name',
  ];
  for (const f of commonFields) {
    or.push({ [f]: { $regex: testRegex } });
  }
  return { $or: or };
}

export async function resetDatabase(options: ResetOptions): Promise<ResetResult> {
  const mode: ResetMode = options.mode || 'soft';
  const dryRun = options.dryRun !== false; // default true
  const includeGridfs = Boolean(options.includeGridfs);
  const preserveEmails = (options.preserveEmails || [])
    .map((s) => (s || '').trim().toLowerCase())
    .filter(Boolean);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not available');
  }

  const collections = (await db.listCollections().toArray()).map((c) => c.name);
  const summary: Record<string, ResetSummaryEntry> = {};

  if (mode === 'soft') {
    for (const name of collections) {
      if (isSystemCollection(name)) continue;
      if (isGridFsCollection(name)) continue;

      let filter: any = buildSoftFilterForCollection(name);
      if (name === 'users' && preserveEmails.length > 0) {
        filter = { $and: [filter, { email: { $nin: preserveEmails } }] };
      }

      let matched = 0;
      try {
        matched = await db.collection(name).countDocuments(filter);
      } catch (_e) {
        continue;
      }
      if (matched === 0) continue;

      summary[name] = { matched, action: dryRun ? 'preview' : 'deleteMany(filter)' };

      if (!dryRun) {
        const res = await db.collection(name).deleteMany(filter as any);
        summary[name].deleted = res.deletedCount || 0;
      }
    }
  } else {
    const toClear = collections.filter((name) => {
      if (isSystemCollection(name)) return false;
      if (!includeGridfs && isGridFsCollection(name)) return false;
      return true;
    });

    if (toClear.includes('users')) {
      let preservedIds: any[] = [];
      if (preserveEmails.length > 0) {
        const keep = await db
          .collection('users')
          .find({ email: { $in: preserveEmails } })
          .project({ _id: 1, email: 1 })
          .toArray();
        preservedIds = keep.map((d) => d._id);
      }

      if (!dryRun) {
        const res = await db
          .collection('users')
          .deleteMany(preservedIds.length ? { _id: { $nin: preservedIds } } : {});
        summary['users'] = {
          matched: res.deletedCount || 0,
          deleted: res.deletedCount || 0,
          action: 'deleteMany(all except preserved)',
        };
      } else {
        const countAll = await db
          .collection('users')
          .countDocuments(preservedIds.length ? { _id: { $nin: preservedIds } } : {});
        summary['users'] = { matched: countAll, action: 'preview (all except preserved)' };
      }
    }

    for (const name of toClear) {
      if (name === 'users') continue;
      if (!includeGridfs && isGridFsCollection(name)) continue;

      if (!dryRun) {
        const res = await db.collection(name).deleteMany({});
        summary[name] = {
          matched: res.deletedCount || 0,
          deleted: res.deletedCount || 0,
          action: 'deleteMany(all)',
        };
      } else {
        const count = await db.collection(name).countDocuments({});
        summary[name] = { matched: count, action: 'preview (all)' };
      }
    }
  }

  return {
    mode,
    dryRun,
    includeGridfs,
    preservedUsers: preserveEmails,
    summary,
  };
}
