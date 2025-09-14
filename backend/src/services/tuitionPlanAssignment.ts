import TuitionPlan from '../models/TuitionPlan';
import Student from '../models/Student';
import mongoose from 'mongoose';

interface ApplyOptions { dryRun?: boolean; limit?: number; }

/**
 * Apply a tuition plan's installments to all matching students (program/department/level or targeting arrays).
 * Copies installments to student.tuitionInstallments only if student has no installments yet or different plan.
 */
export async function applyTuitionPlanToGroup(planId: string, opts: ApplyOptions = {}) {
  const plan: any = await TuitionPlan.findById(planId).lean();
  if (!plan) throw new Error('Plan not found');
  if (!plan.active) throw new Error('Plan inactive');

  // Build match criteria: any of singular fields OR any of targeting arrays (union semantics)
  const or: any[] = [];
  if (plan.program) or.push({ program: plan.program });
  if (plan.department) or.push({ department: plan.department });
  if (plan.level) or.push({ level: plan.level });
  if (plan.programs && plan.programs.length) or.push({ program: { $in: plan.programs } });
  if (plan.departments && plan.departments.length) or.push({ department: { $in: plan.departments } });
  if (plan.levels && plan.levels.length) or.push({ level: { $in: plan.levels } });
  // speciality placeholder: assume stored on student as session or notes? Skip unless field exists.

  const match: any = { isActive: true };
  if (or.length) match.$or = or; else throw new Error('Plan has no targeting criteria');

  const cursor = Student.find(match).cursor();
  const results: any[] = [];
  let processed = 0;
  for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
    if (opts.limit && processed >= opts.limit) break;
    processed++;
    const needsUpdate = !doc.tuitionPlan || String(doc.tuitionPlan) !== String(plan._id);
    if (!needsUpdate) continue;
    // Build installment copies
    const installments = (plan.installments || []).map((i: any) => ({
      key: i.key,
      label: i.label || i.key,
      amountDue: i.amount,
      paid: 0,
      dueDate: i.dueDate || null,
      status: 'Pending'
    }));
    if (!opts.dryRun) {
      doc.tuitionPlan = plan._id;
      doc.tuitionInstallments = installments;
      doc.balanceDue = installments.reduce((s: number, it: any) => s + (it.amountDue || 0), 0);
      doc.totalPaid = 0;
      await doc.save();
    }
    results.push({ studentId: doc._id, updated: !opts.dryRun });
  }
  return { planId: plan._id, processed, updated: results.length, results, dryRun: !!opts.dryRun };
}

/**
 * Scan for due/overdue installments and return list with reminder update capability.
 */
export async function findDueInstallments(now = new Date()) {
  const today = now;
  // match installments with dueDate <= today and status not Paid
  const students = await Student.find({ 'tuitionInstallments.dueDate': { $lte: today }, isActive: true })
    .select('tuitionInstallments names studentId program department level guardian phoneNumber')
    .lean();
  const due: any[] = [];
  for (const s of students) {
    for (const insRaw of s.tuitionInstallments || []) {
      const ins: any = insRaw as any;
      if (!ins.dueDate) continue;
      if (new Date(ins.dueDate) <= today && ins.status !== 'Paid') {
        due.push({ studentId: s._id, student: s.studentId, installment: ins.key, amountDue: ins.amountDue, paid: ins.paid, dueDate: ins.dueDate, status: ins.status, lastReminderSent: ins.lastReminderSent, timesReminded: ins.timesReminded });
      }
    }
  }
  return due;
}

export async function markReminderSent(studentId: mongoose.Types.ObjectId, installmentKey: string) {
  await Student.updateOne({ _id: studentId, 'tuitionInstallments.key': installmentKey }, {
    $set: { 'tuitionInstallments.$.lastReminderSent': new Date() },
    $inc: { 'tuitionInstallments.$.timesReminded': 1 }
  });
}
