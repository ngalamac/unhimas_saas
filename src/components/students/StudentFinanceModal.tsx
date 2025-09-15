import React, { useEffect, useState } from 'react';
import { getStudentFinance, StudentFinanceResponse } from '../../api/students';
import { getTuitionPaymentHistory } from '../../api/tuitionManagement';
import { formatXAF } from '../../utils/currency';

interface Props {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
}

interface TabDef { key: string; label: string; }
const tabs: TabDef[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'payments', label: 'Payments' },
  { key: 'installments', label: 'Installments' },
  { key: 'ledger', label: 'Ledger' }
];

const fmt = (n: number | undefined | null) => {
  if (typeof n !== 'number' || isNaN(n)) return '-';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

export const StudentFinanceModal: React.FC<Props> = ({ studentId, open, onClose }) => {
  const [data, setData] = useState<StudentFinanceResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [period, setPeriod] = useState<string>('');
  const [tuitionHistory, setTuitionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open && studentId) {
      setLoading(true); setError(null);
      Promise.all([
        getStudentFinance(studentId, period ? { period } : undefined),
        getTuitionPaymentHistory(studentId, period ? { fromDate: `${period}-01`, toDate: `${period}-31` } : undefined)
      ])
        .then(([financeRes, historyRes]) => {
          setData(financeRes.data);
          setTuitionHistory(historyRes.data || []);
        })
        .catch(e => setError(e?.message || 'Failed to load finance'))
        .finally(() => setLoading(false));
    } else if (!open) {
      setData(null); setActiveTab('summary'); setPeriod(''); setTuitionHistory([]);
    }
  }, [open, studentId, period]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-[95%] max-w-6xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Student Finance {data?.student?.studentId ? `— ${data.student.studentId}` : ''}</h2>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              title="Filter ledger period (YYYY-MM)"
            />
            <button onClick={onClose} className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Close</button>
          </div>
        </div>
        <div className="px-4 pt-2 border-b flex gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1 text-sm rounded-t ${activeTab === t.key ? 'bg-white border border-b-white' : 'bg-gray-100 hover:bg-gray-200 border border-transparent'}`}>{t.label}</button>
          ))}
          <button onClick={() => setActiveTab('tuition')}
            className={`px-3 py-1 text-sm rounded-t ${activeTab === 'tuition' ? 'bg-white border border-b-white' : 'bg-gray-100 hover:bg-gray-200 border border-transparent'}`}>
            Tuition History
          </button>
        </div>
        <div className="p-4 overflow-auto text-sm flex-1">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && data && (
            <>
              {activeTab === 'summary' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="text-xs uppercase text-gray-500">Tuition Status</div>
                    <div className="text-lg font-semibold">{data.summary.tuitionStatus}</div>
                  </div>
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="text-xs uppercase text-gray-500">Installments</div>
                    <div className="text-sm">Due: <span className="font-semibold">{fmt(data.summary.totalInstallmentDue)}</span></div>
                    <div className="text-sm">Paid: <span className="font-semibold text-green-600">{fmt(data.summary.totalInstallmentPaid)}</span></div>
                    <div className="text-sm">Remaining: <span className="font-semibold text-orange-600">{fmt(data.summary.totalInstallmentRemaining)}</span></div>
                  </div>
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="text-xs uppercase text-gray-500">Ledger</div>
                    <div className="text-sm">Debit: <span className="font-semibold">{fmt(data.summary.accountingLedgerDebit)}</span></div>
                    <div className="text-sm">Credit: <span className="font-semibold">{fmt(data.summary.accountingLedgerCredit)}</span></div>
                    <div className="text-sm">Balance: <span className="font-semibold">{fmt(data.summary.accountingLedgerBalance)}</span></div>
                  </div>
                  <div className="border rounded p-3 bg-gray-50 col-span-full md:col-span-3">
                    <div className="text-xs uppercase text-gray-500">Student Totals (Recorded)</div>
                    <div className="flex flex-wrap gap-6 mt-1">
                      <div>Paid: <span className="font-semibold text-green-600">{fmt(data.summary.studentRecordedTotalPaid)}</span></div>
                      <div>Balance: <span className="font-semibold text-orange-600">{fmt(data.summary.studentRecordedBalance)}</span></div>
                      <div>Payments Total: <span className="font-semibold">{fmt(data.summary.paymentsTotal)}</span></div>
                      <div>Payments: <span className="font-semibold">{data.summary.paymentsCount}</span></div>
                      <div>Ledger Lines: <span className="font-semibold">{data.summary.ledgerLinesCount}</span></div>
                    </div>
                    {data.summary.paymentsCount > 0 && !data.installments.length && (
                      <div className="mt-2 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                        Payments have been recorded even though no tuition installments are defined for this student. The Paid total reflects direct payments.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'tuition' && (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">OHADA-Integrated Tuition Payments</h4>
                    <p className="text-sm text-blue-800">
                      All tuition payments are automatically recorded in the OHADA accounting system 
                      with proper journal entries and account classifications.
                    </p>
                  </div>
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Installment</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-left">Method</th>
                        <th className="p-2 text-left">OHADA Account</th>
                        <th className="p-2 text-left">Journal Entry</th>
                        <th className="p-2 text-left">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tuitionHistory.map((payment, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td className="p-2">{payment.installmentKey}</td>
                          <td className="p-2 text-right font-medium text-green-600">{formatXAF(payment.amount)}</td>
                          <td className="p-2 capitalize">{payment.paymentMethod?.replace('_', ' ')}</td>
                          <td className="p-2 font-mono text-xs">{payment.ohadaAccountCode || '—'}</td>
                          <td className="p-2">
                            {payment.ohadaJournalEntry ? (
                              <button className="text-blue-600 hover:underline text-xs">
                                View Entry
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-2">{payment.registeredBy?.name || '—'}</td>
                        </tr>
                      ))}
                      {tuitionHistory.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-500">
                            No tuition payment history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'payments' && (
                <div>
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1 text-left">Date</th>
                        <th className="p-1 text-left">Amount</th>
                        <th className="p-1 text-left">Installment</th>
                        <th className="p-1 text-left">Method</th>
                        <th className="p-1 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map(p => (
                        <tr key={p._id} className="border-t">
                          <td className="p-1">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="p-1 font-medium">{fmt(p.amount)}</td>
                          <td className="p-1">{p.installmentKey || '-'}</td>
                          <td className="p-1">{p.method || '-'}</td>
                          <td className="p-1 max-w-[180px] truncate" title={p.notes}>{p.notes || ''}</td>
                        </tr>
                      ))}
                      {!data.payments.length && <tr><td className="p-2 text-center text-gray-500" colSpan={5}>No payments</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'installments' && (
                <div>
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1 text-left">Label</th>
                        <th className="p-1 text-right">Amount</th>
                        <th className="p-1 text-right">Paid</th>
                        <th className="p-1 text-right">Remaining</th>
                        <th className="p-1 text-left">Status</th>
                        <th className="p-1 text-left">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.installments.map(ins => (
                        <tr key={ins.key} className="border-t">
                          <td className="p-1">{ins.label || ins.key}</td>
                          <td className="p-1 text-right">{fmt(ins.amountDue)}</td>
                          <td className="p-1 text-right text-green-600 font-medium">{fmt(ins.paid)}</td>
                          <td className="p-1 text-right text-orange-600">{fmt(ins.remaining)}</td>
                          <td className="p-1">{ins.status}</td>
                          <td className="p-1">{ins.dueDate ? new Date(ins.dueDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                      {!data.installments.length && <tr><td className="p-2 text-center text-gray-500" colSpan={6}>No installments</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'ledger' && (
                <div>
                  <table className="w-full text-[11px] border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1 text-left">Date</th>
                        <th className="p-1 text-left">Entry #</th>
                        <th className="p-1 text-left">Acct</th>
                        <th className="p-1 text-right">Debit</th>
                        <th className="p-1 text-right">Credit</th>
                        <th className="p-1 text-left">Desc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ledger.lines.map((l,i) => (
                        <tr key={i} className="border-t">
                          <td className="p-1">{new Date(l.date).toLocaleDateString()}</td>
                          <td className="p-1">{l.entryNumber}</td>
                          <td className="p-1">{l.accountCode} {l.accountName}</td>
                          <td className="p-1 text-right">{l.debit ? fmt(l.debit) : ''}</td>
                          <td className="p-1 text-right">{l.credit ? fmt(l.credit) : ''}</td>
                          <td className="p-1">{l.description}</td>
                        </tr>
                      ))}
                      {!data.ledger.lines.length && <tr><td className="p-2 text-center text-gray-500" colSpan={6}>No ledger lines</td></tr>}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td className="p-1" colSpan={3}>Totals</td>
                        <td className="p-1 text-right">{fmt(data.ledger.totals.debit)}</td>
                        <td className="p-1 text-right">{fmt(data.ledger.totals.credit)}</td>
                        <td className="p-1">Balance: {fmt(data.ledger.totals.balance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFinanceModal;
