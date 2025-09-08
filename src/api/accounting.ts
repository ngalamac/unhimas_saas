import fetchClient from '../lib/fetchClient';

const BASE_URL = '/api/accounting';

// Types (based on backend models)
export interface OfficeTransaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  categoryId: string;
  amount: number;
  date: string;
  registeredBy: any; // Consider creating a User type
  branch: any; // Consider creating a Branch type
  linkedStudent?: any;
  linkedStaff?: any;
  description?: string;
  reference?: string;
  paymentMethod?: string;
  attachments?: any[];
  status: 'approved' | 'pending' | 'rejected';
}

export interface Category {
    _id: string;
    name: string;
    type: 'income' | 'expense';
    description?: string;
    branch?: any;
    createdBy?: any;
    isActive: boolean;
}

export interface Summary {
    totals: Array<{_id: 'income' | 'expense', total: number, count: number}>;
    breakdown: Array<{_id: {category: string, type: 'income' | 'expense'}, total: number, count: number}>;
    monthlyTrends: any[];
    summary: {
        totalIncome: number;
        totalExpenses: number;
        netIncome: number;
        transactionCount: number;
    }
}

// API Functions

export async function fetchTransactions(params?: Record<string, any>): Promise<{ data: OfficeTransaction[], meta: any }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetchClient.get(`${BASE_URL}?${query}`);
    if (!res.ok) {
        throw new Error('Failed to fetch transactions');
    }
    return res.json();
}

export async function createTransaction(transactionData: Partial<OfficeTransaction>): Promise<OfficeTransaction> {
    const res = await fetchClient.postJson(BASE_URL, transactionData);
    if (!res.ok) {
        throw new Error('Failed to create transaction');
    }
    return res.json();
}

export async function fetchTransaction(id: string): Promise<OfficeTransaction> {
    const res = await fetchClient.get(`${BASE_URL}/${id}`);
    if (!res.ok) {
        throw new Error('Failed to fetch transaction');
    }
    return res.json();
}

export async function updateTransaction(id: string, updates: Partial<OfficeTransaction>): Promise<OfficeTransaction> {
    const res = await fetchClient.put(`${BASE_URL}/${id}`, updates);
    if (!res.ok) {
        throw new Error('Failed to update transaction');
    }
    return res.json();
}

export async function deleteTransaction(id: string): Promise<{ success: boolean }> {
    const res = await fetchClient.delete(`${BASE_URL}/${id}`);
    if (!res.ok) {
        throw new Error('Failed to delete transaction');
    }
    return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
    const res = await fetchClient.get(`${BASE_URL}/categories`);
    if (!res.ok) {
        throw new Error('Failed to fetch categories');
    }
    return res.json();
}

export async function createCategory(categoryData: Partial<Category>): Promise<Category> {
    const res = await fetchClient.postJson(`${BASE_URL}/categories`, categoryData);
    if (!res.ok) {
        throw new Error('Failed to create category');
    }
    return res.json();
}

export async function exportTransactions(params?: Record<string, any>): Promise<Blob> {
    const query = new URLSearchParams(params).toString();
    const res = await fetchClient.get(`${BASE_URL}/export?${query}`);
    if (!res.ok) {
        throw new Error('Failed to export transactions');
    }
    return res.blob();
}

export async function fetchIncomeStatement(params?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const res = await fetchClient.get(`${BASE_URL}/reports/income-statement?${query}`);
    if (!res.ok) {
        throw new Error('Failed to fetch income statement');
    }
    return res.json();
}

export async function fetchExpenseStatement(params?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const res = await fetchClient.get(`${BASE_URL}/reports/expense-statement?${query}`);
    if (!res.ok) {
        throw new Error('Failed to fetch expense statement');
    }
    return res.json();
}

export async function fetchBalanceSheet(params?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const res = await fetchClient.get(`${BASE_URL}/reports/balance-sheet?${query}`);
    if (!res.ok) {
        throw new Error('Failed to fetch balance sheet');
    }
    return res.json();
}

export async function fetchSummary(params?: Record<string, any>): Promise<Summary> {
    const query = new URLSearchParams(params).toString();
    const res = await fetchClient.get(`${BASE_URL}/summary?${query}`);
    if (!res.ok) {
        throw new Error('Failed to fetch accounting summary');
    }
    return res.json();
}
