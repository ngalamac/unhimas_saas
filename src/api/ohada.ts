import fetchClient, { handleFetchError } from '../lib/fetchClient';
import { 
  OHADAAccount, 
  OHADAJournalEntry, 
  OHADATrialBalance, 
  OHADABalanceSheet, 
  OHADAIncomeStatement,
  OHADACashFlow,
  OHADAAccountingPeriod,
  OHADABudget
} from '../types/ohada';

const BASE = '/api/ohada';

// Chart of Accounts Management
export async function getOHADAAccounts(): Promise<{ data: OHADAAccount[] }> {
  const res = await fetchClient.get(`${BASE}/accounts`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createOHADAAccount(payload: Partial<OHADAAccount>): Promise<{ data: OHADAAccount }> {
  const res = await fetchClient.postJson(`${BASE}/accounts`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function updateOHADAAccount(id: string, payload: Partial<OHADAAccount>): Promise<{ data: OHADAAccount }> {
  const res = await fetchClient.put(`${BASE}/accounts/${id}`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Journal Entry Management
export async function getOHADAJournalEntries(params?: {
  page?: number;
  limit?: number;
  period?: string;
  status?: string;
  search?: string;
}): Promise<{ data: OHADAJournalEntry[]; meta: any }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.period) query.append('period', params.period);
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const res = await fetchClient.get(`${BASE}/journal?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createOHADAJournalEntry(payload: Partial<OHADAJournalEntry>): Promise<{ data: OHADAJournalEntry }> {
  const res = await fetchClient.postJson(`${BASE}/journal`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function postOHADAJournalEntry(id: string): Promise<{ data: OHADAJournalEntry }> {
  const res = await fetchClient.postJson(`${BASE}/journal/${id}/post`, {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function reverseOHADAJournalEntry(id: string, reason: string): Promise<{ data: OHADAJournalEntry }> {
  const res = await fetchClient.postJson(`${BASE}/journal/${id}/reverse`, { reason });
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Financial Reports
export async function getOHADATrialBalance(period: string, branch?: string): Promise<{ data: OHADATrialBalance }> {
  const query = new URLSearchParams({ period });
  if (branch) query.append('branch', branch);

  const res = await fetchClient.get(`${BASE}/reports/trial-balance?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function getOHADABalanceSheet(period: string, branch?: string): Promise<{ data: OHADABalanceSheet }> {
  const query = new URLSearchParams({ period });
  if (branch) query.append('branch', branch);

  const res = await fetchClient.get(`${BASE}/reports/balance-sheet?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function getOHADAIncomeStatement(period: string, branch?: string): Promise<{ data: OHADAIncomeStatement }> {
  const query = new URLSearchParams({ period });
  if (branch) query.append('branch', branch);

  const res = await fetchClient.get(`${BASE}/reports/income-statement?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function getOHADACashFlow(period: string, branch?: string): Promise<{ data: OHADACashFlow }> {
  const query = new URLSearchParams({ period });
  if (branch) query.append('branch', branch);

  const res = await fetchClient.get(`${BASE}/reports/cash-flow?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Accounting Periods
export async function getOHADAAccountingPeriods(): Promise<{ data: OHADAAccountingPeriod[] }> {
  const res = await fetchClient.get(`${BASE}/periods`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createOHADAAccountingPeriod(payload: Partial<OHADAAccountingPeriod>): Promise<{ data: OHADAAccountingPeriod }> {
  const res = await fetchClient.postJson(`${BASE}/periods`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function closeOHADAAccountingPeriod(id: string): Promise<{ data: OHADAAccountingPeriod }> {
  const res = await fetchClient.postJson(`${BASE}/periods/${id}/close`, {});
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Budget Management
export async function getOHADABudgets(): Promise<{ data: OHADABudget[] }> {
  const res = await fetchClient.get(`${BASE}/budgets`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

export async function createOHADABudget(payload: Partial<OHADABudget>): Promise<{ data: OHADABudget }> {
  const res = await fetchClient.postJson(`${BASE}/budgets`, payload);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.json();
}

// Export Functions
export async function exportOHADAReport(
  reportType: 'trial_balance' | 'balance_sheet' | 'income_statement' | 'cash_flow' | 'general_ledger',
  period: string,
  format: 'excel' | 'pdf' | 'csv',
  branch?: string
): Promise<Blob> {
  const query = new URLSearchParams({ period, format });
  if (branch) query.append('branch', branch);

  const res = await fetchClient.get(`${BASE}/reports/${reportType}/export?${query.toString()}`);
  if (!res.ok) {
    await handleFetchError(res);
  }
  return res.blob();
}

export async function importOHADAJournalEntries(file: File): Promise<{ data: { imported: number; errors: string[] } }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = fetchClient.getAuthToken();
  const response = await fetch(`${window.location.origin}${BASE}/journal/import`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to import journal entries');
  }

  return response.json();
}