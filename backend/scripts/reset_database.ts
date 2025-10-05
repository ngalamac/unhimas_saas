import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { resetDatabase } from '../src/services/resetService';

type ResetMode = 'soft' | 'hard';

interface ParsedArgs {
  mode: ResetMode;
  dryRun: boolean;
  apply: boolean;
  yes: boolean;
  includeGridfs: boolean;
  preserveEmails: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    mode: 'soft',
    dryRun: true,
    apply: false,
    yes: false,
    includeGridfs: false,
    preserveEmails: [],
  };

  for (const raw of argv) {
    const [k, v] = raw.includes('=') ? (raw.split('=') as [string, string]) : [raw, ''];
    switch (true) {
      case /^--mode=/.test(raw): {
        const m = (v || '').toLowerCase();
        if (m === 'soft' || m === 'hard') args.mode = m as ResetMode;
        break;
      }
      case raw === '--dry-run': {
        args.dryRun = true;
        args.apply = false;
        break;
      }
      case raw === '--apply': {
        args.apply = true;
        args.dryRun = false;
        break;
      }
      case raw === '-y' || raw === '--yes': {
        args.yes = true;
        break;
      }
      case raw === '--include-gridfs': {
        args.includeGridfs = true;
        break;
      }
      case /^--preserve=/.test(raw): {
        const emails = (v || '')
          .split(/[;,]/)
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
        args.preserveEmails.push(...emails);
        break;
      }
      default:
        break;
    }
  }

  return args;
}

function usage(): string {
  return [
    'Usage: ts-node scripts/reset_database.ts [--mode=soft|hard] [--dry-run|--apply] [--include-gridfs] [--preserve=email1,email2] [-y|--yes]',
    '',
    'Defaults: --mode=soft --dry-run',
    '',
    'Examples:',
    '  Dry-run (soft):  ts-node scripts/reset_database.ts',
    '  Apply (soft):    ts-node scripts/reset_database.ts --apply -y',
    '  Hard wipe:       ts-node scripts/reset_database.ts --mode=hard --apply -y',
    '  Keep admins:     ts-node scripts/reset_database.ts --mode=hard --apply -y --preserve=admin@your.org,owner@your.org',
    '  Include GridFS:  ts-node scripts/reset_database.ts --mode=hard --apply -y --include-gridfs',
  ].join('\n');
}

function getWhitelistEmails(args: ParsedArgs): string[] {
  const envList = [
    process.env.SUPER_ADMIN_EMAIL,
    process.env.SUPER_ADMIN_EMAILS, // optional comma-separated list
  ]
    .filter(Boolean)
    .flatMap(v => (v as string).split(/[;,]/))
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const cli = (args.preserveEmails || []).map(s => s.trim().toLowerCase()).filter(Boolean);
  const set = new Set<string>([...envList, ...cli]);
  return [...set];
}

async function ensureConnected(): Promise<void> {
  const envPath = path.join(__dirname, '../.env');
  dotenv.config({ path: envPath });
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI is not set. Aborting.');
    console.error('Tip: create backend/.env with MONGO_URI or pass via environment.');
    process.exit(2);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 } as any);
}

function isSystemCollection(name: string): boolean {
  return name.startsWith('system.');
}

function isGridFsCollection(name: string): boolean {
  return name === 'uploads.files' || name === 'uploads.chunks';
}

function buildSoftFilterForCollection(name: string) {
  // Common regexes to catch test/dev fixtures
  const testRegex = /test|smoke|sample|dummy|fixture|lifecycle|to(update|delete)|stud/iu;
  const emailTestRegex = /(@test\.com$)|(@example\.com$)|(@branch\.test$)|(^smoke@)|(^tuition-smoke@)/iu;

  const or: any[] = [];

  // Heuristics by collection
  if (name === 'users') {
    or.push({ email: { $regex: emailTestRegex } });
    or.push({ name: { $regex: testRegex } });
    return { $or: or };
  }

  if (name === 'uploads.files') {
    return { 'metadata.originalname': { $regex: testRegex } };
    }

  // Generic: try common string-ish fields
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

async function run() {
  const args = parseArgs(process.argv.slice(2));

  const banner = `\n== UNHIMAS RESET DATABASE ==\nMode: ${args.mode.toUpperCase()}  DryRun: ${args.dryRun ? 'YES' : 'NO'}  Apply: ${args.apply ? 'YES' : 'NO'}  IncludeGridFS: ${args.includeGridfs ? 'YES' : 'NO'}\n`;
  console.log(banner);
  if (!args.apply && !args.dryRun) {
    // default to dry-run if neither specified
    args.dryRun = true;
  }
  if (args.apply && !args.yes) {
    console.error('Refusing to proceed: --apply requires explicit confirmation with -y or --yes');
    console.log('\n' + usage());
    process.exit(2);
  }

  await ensureConnected();
  const whitelistEmails = getWhitelistEmails(args);
  const result = await resetDatabase({
    mode: args.mode,
    dryRun: !args.apply,
    includeGridfs: args.includeGridfs,
    preserveEmails: whitelistEmails,
  });

  console.log('\nSummary:');
  const names = Object.keys(result.summary);
  if (names.length === 0) {
    console.log('No matching documents found for the selected mode/filters.');
  } else {
    for (const n of names) {
      const s = result.summary[n];
      console.log(`- ${n}: ${s.action}  matched=${s.matched ?? 0}${s.deleted !== undefined ? ` deleted=${s.deleted}` : ''}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Reset failed:', err);
  try {
    mongoose.disconnect();
  } catch {}
  process.exit(1);
});
