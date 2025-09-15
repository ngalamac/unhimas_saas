import mongoose from 'mongoose';
import Department from '../src/models/Department';
import Program from '../src/models/Program';

// Usage: ts-node scripts/findOrphanDepartments.ts mongodb://localhost:27017/yourdb
async function main() {
  const uri = process.argv[2];
  if (!uri) {
    console.error('Provide Mongo connection string as first arg');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const depts = await Department.find().lean();
  const results: any[] = [];
  for (const d of depts) {
    if (!d.program) {
      results.push({ _id: d._id, name: d.name, issue: 'NO_PROGRAM_FIELD' });
      continue;
    }
    const prog = await Program.findById(d.program).lean();
    if (!prog) {
      results.push({ _id: d._id, name: d.name, program: d.program, issue: 'PROGRAM_MISSING' });
    }
  }
  console.log('\nOrphan Department Report');
  console.log('========================');
  if (results.length === 0) {
    console.log('No orphan departments found.');
  } else {
    results.forEach(r => console.log(JSON.stringify(r)));
    console.log(`\nTotal: ${results.length}`);
  }
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
