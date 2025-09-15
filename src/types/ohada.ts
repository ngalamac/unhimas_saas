// OHADA (Organization for the Harmonization of Business Law in Africa) Accounting Types

export interface OHADAAccount {
  _id: string;
  code: string; // OHADA account code (e.g., 101, 211, 601)
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  category: 'current' | 'non-current' | 'operating' | 'financial' | 'extraordinary';
  parentCode?: string; // For sub-accounts
  level: number; // 1-4 (Class, Group, Account, Sub-account)
  isActive: boolean;
  balance: number;
  debitBalance: number;
  creditBalance: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OHADAJournalEntry {
  _id: string;
  entryNumber: string; // Sequential journal entry number
  date: string;
  reference: string; // External reference (invoice, receipt, etc.)
  description: string;
  lines: OHADAJournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'reversed';
  reversalEntry?: string; // Reference to reversal entry
  attachments?: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
  };
  branch: {
    _id: string;
    name: string;
  };
  period: string; // Accounting period (YYYY-MM)
  createdAt: string;
  updatedAt: string;
}

export interface OHADAJournalLine {
  account: OHADAAccount | string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  analyticalCode?: string; // For cost center analysis
}

export interface OHADATrialBalance {
  period: string;
  accounts: Array<{
    code: string;
    name: string;
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
  }>;
  totals: {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
  };
}

export interface OHADABalanceSheet {
  period: string;
  assets: {
    nonCurrentAssets: Array<{ code: string; name: string; amount: number }>;
    currentAssets: Array<{ code: string; name: string; amount: number }>;
    totalAssets: number;
  };
  liabilitiesAndEquity: {
    equity: Array<{ code: string; name: string; amount: number }>;
    nonCurrentLiabilities: Array<{ code: string; name: string; amount: number }>;
    currentLiabilities: Array<{ code: string; name: string; amount: number }>;
    totalLiabilitiesAndEquity: number;
  };
}

export interface OHADAIncomeStatement {
  period: string;
  revenue: Array<{ code: string; name: string; amount: number }>;
  expenses: Array<{ code: string; name: string; amount: number }>;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  totalRevenue: number;
  totalExpenses: number;
}

export interface OHADACashFlow {
  period: string;
  operatingActivities: {
    netIncome: number;
    adjustments: Array<{ description: string; amount: number }>;
    workingCapitalChanges: Array<{ description: string; amount: number }>;
    netCashFromOperating: number;
  };
  investingActivities: {
    activities: Array<{ description: string; amount: number }>;
    netCashFromInvesting: number;
  };
  financingActivities: {
    activities: Array<{ description: string; amount: number }>;
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface OHADAAccountingPeriod {
  _id: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed' | 'locked';
  closingEntries?: string[]; // Journal entry IDs for period closing
  branch: string;
  createdAt: string;
}

// OHADA Standard Chart of Accounts Structure
export const OHADAChartOfAccounts = {
  // Class 1: Capital Accounts
  '1': {
    name: 'Capital Accounts',
    accounts: {
      '101': 'Capital',
      '106': 'Reserves',
      '110': 'Carried Forward',
      '120': 'Result of the Year',
      '131': 'Subsidies',
      '140': 'Provisions for Risks and Charges',
      '150': 'Provisions for Depreciation',
      '160': 'Loans and Debts',
      '170': 'Debts Related to Participations',
      '180': 'Accounts Payable',
      '190': 'Net Worth'
    }
  },
  // Class 2: Fixed Assets
  '2': {
    name: 'Fixed Assets',
    accounts: {
      '201': 'Research and Development Costs',
      '205': 'Concessions and Similar Rights',
      '210': 'Land',
      '213': 'Buildings',
      '215': 'Technical Installations',
      '218': 'Other Fixed Assets',
      '220': 'Participations',
      '230': 'Other Financial Fixed Assets',
      '240': 'Equipment and Tools',
      '244': 'Furniture',
      '245': 'Office Equipment',
      '250': 'Transportation Equipment',
      '260': 'Deposits and Guarantees',
      '270': 'Long-term Investments',
      '280': 'Depreciation of Fixed Assets'
    }
  },
  // Class 3: Inventory
  '3': {
    name: 'Inventory',
    accounts: {
      '301': 'Raw Materials',
      '302': 'Other Supplies',
      '310': 'Work in Progress',
      '320': 'Intermediate Products',
      '330': 'Residual Products',
      '340': 'Finished Products',
      '350': 'Goods',
      '380': 'Inventory Depreciation'
    }
  },
  // Class 4: Third Party Accounts
  '4': {
    name: 'Third Party Accounts',
    accounts: {
      '401': 'Suppliers',
      '402': 'Suppliers - Invoices Not Received',
      '403': 'Suppliers - Retentions',
      '404': 'Suppliers - Equipment',
      '405': 'Suppliers - Notes Payable',
      '408': 'Suppliers - Disputed Invoices',
      '409': 'Suppliers - Debit Balances',
      '411': 'Customers',
      '413': 'Customers - Disputed Receivables',
      '416': 'Customers - Doubtful Debts',
      '418': 'Customers - Products Not Yet Invoiced',
      '419': 'Customers - Credit Balances',
      '421': 'Personnel - Salaries Due',
      '422': 'Personnel - Works Council',
      '423': 'Personnel - Social Security',
      '424': 'Personnel - Participations',
      '425': 'Personnel - Advances',
      '426': 'Personnel - Deposits',
      '427': 'Personnel - Opposition',
      '428': 'Personnel - Charges to Pay',
      '431': 'Social Security',
      '437': 'Other Social Organizations',
      '441': 'State - Subsidies',
      '442': 'State - Taxes',
      '443': 'State - VAT',
      '444': 'State - Taxes on Salaries',
      '445': 'State - Other Taxes',
      '446': 'State - Grants',
      '447': 'State - Other Operations',
      '448': 'State - Charges to Pay',
      '449': 'State - Disputed Taxes',
      '451': 'Associated Companies',
      '455': 'Associated Companies - Current Accounts',
      '456': 'Associated Companies - Advances',
      '458': 'Associated Companies - Disputed Accounts',
      '461': 'Shareholders - Capital Calls',
      '462': 'Shareholders - Versements Received',
      '463': 'Shareholders - Advances',
      '464': 'Shareholders - Dividends',
      '465': 'Shareholders - Current Accounts',
      '467': 'Shareholders - Disputed Accounts',
      '471': 'Debtors - General Accounts',
      '472': 'Debtors - Deposits Received',
      '473': 'Debtors - Retentions',
      '474': 'Debtors - Other Operations',
      '475': 'Creditors - General Accounts',
      '476': 'Creditors - Deposits Paid',
      '477': 'Creditors - Retentions',
      '478': 'Creditors - Other Operations',
      '481': 'Charges to Distribute',
      '486': 'Charges Paid in Advance',
      '487': 'Products Received in Advance',
      '488': 'Accounts in Suspense',
      '490': 'Depreciation of Third Party Accounts'
    }
  },
  // Class 5: Financial Accounts
  '5': {
    name: 'Financial Accounts',
    accounts: {
      '501': 'Bank - Current Account',
      '502': 'Bank - Savings Account',
      '503': 'Bank - Time Deposits',
      '504': 'Bank - Foreign Currency',
      '505': 'Bank - Overdrafts',
      '510': 'Postal Checks',
      '511': 'Treasury',
      '512': 'Bank Drafts',
      '513': 'Money Orders',
      '514': 'Checks to be Cashed',
      '515': 'Checks Issued',
      '516': 'Bank Transfers',
      '517': 'Other Bank Operations',
      '518': 'Other Financial Institutions',
      '520': 'Cash',
      '521': 'Cash - Foreign Currency',
      '522': 'Cash - Stamps',
      '523': 'Cash - Advances',
      '530': 'Short-term Investments',
      '531': 'Marketable Securities',
      '532': 'Bonds',
      '533': 'Other Securities',
      '540': 'Investment Certificates',
      '550': 'Current Bank Loans',
      '560': 'Credit Balances of Banks',
      '580': 'Depreciation of Financial Assets'
    }
  },
  // Class 6: Expense Accounts
  '6': {
    name: 'Expense Accounts',
    accounts: {
      '601': 'Purchases of Raw Materials',
      '602': 'Purchases of Other Supplies',
      '603': 'Variations in Inventory',
      '604': 'Purchases of Studies and Services',
      '605': 'Equipment Purchases',
      '606': 'Supplies Purchases',
      '607': 'Purchases of Goods',
      '608': 'Purchase Returns',
      '609': 'Purchase Discounts',
      '611': 'Subcontracting',
      '612': 'Rent and Rental Charges',
      '613': 'Maintenance and Repairs',
      '614': 'Insurance Premiums',
      '615': 'Studies and Research',
      '616': 'Documentation',
      '617': 'Advertising and Public Relations',
      '618': 'Transportation',
      '619': 'Travel and Entertainment',
      '621': 'Personnel Costs',
      '622': 'Salaries and Wages',
      '623': 'Social Security Contributions',
      '624': 'Training Costs',
      '625': 'Other Personnel Costs',
      '631': 'Taxes and Similar Charges',
      '632': 'Professional Taxes',
      '633': 'Registration Taxes',
      '634': 'Other Taxes',
      '641': 'Financial Charges',
      '642': 'Interest on Loans',
      '643': 'Interest on Current Accounts',
      '644': 'Bank Charges',
      '645': 'Exchange Losses',
      '646': 'Net Losses on Disposals',
      '647': 'Other Financial Charges',
      '651': 'Extraordinary Charges',
      '658': 'Other Extraordinary Charges',
      '661': 'Depreciation Charges',
      '671': 'Provision Charges',
      '681': 'Depreciation of Fixed Assets',
      '691': 'Participation of Employees',
      '695': 'Income Tax',
      '697': 'Exceptional Charges',
      '699': 'Tax on Companies'
    }
  },
  // Class 7: Income Accounts
  '7': {
    name: 'Income Accounts',
    accounts: {
      '701': 'Sales of Finished Products',
      '702': 'Sales of Intermediate Products',
      '703': 'Sales of Residual Products',
      '704': 'Work Done',
      '705': 'Studies Done',
      '706': 'Other Services',
      '707': 'Sales of Goods',
      '708': 'Sales Returns',
      '709': 'Sales Discounts',
      '711': 'Variation in Inventory',
      '712': 'Immobilized Production',
      '713': 'Immobilized Studies',
      '721': 'Production Stored',
      '722': 'Immobilized Production',
      '731': 'Subsidies',
      '732': 'Operating Subsidies',
      '733': 'Investment Subsidies',
      '734': 'Equipment Subsidies',
      '741': 'Financial Income',
      '742': 'Income from Participations',
      '743': 'Income from Other Securities',
      '744': 'Income from Loans',
      '745': 'Exchange Gains',
      '746': 'Net Gains on Disposals',
      '747': 'Other Financial Income',
      '751': 'Extraordinary Income',
      '758': 'Other Extraordinary Income',
      '771': 'Provision Reversals',
      '781': 'Depreciation Reversals',
      '791': 'Employee Participation',
      '797': 'Exceptional Income'
    }
  },
  // Class 8: Special Accounts
  '8': {
    name: 'Special Accounts',
    accounts: {
      '801': 'Commitments Given',
      '802': 'Commitments Received',
      '803': 'Guarantees Given',
      '804': 'Guarantees Received',
      '805': 'Currency Commitments',
      '806': 'Order Commitments',
      '807': 'Other Commitments'
    }
  }
};

export interface OHADAAccountingPeriod {
  _id: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed' | 'locked';
  branch: string;
  openingBalances: Array<{
    accountCode: string;
    debitBalance: number;
    creditBalance: number;
  }>;
  closingBalances: Array<{
    accountCode: string;
    debitBalance: number;
    creditBalance: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OHADAReportTemplate {
  _id: string;
  name: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'general_ledger';
  template: {
    sections: Array<{
      title: string;
      accounts: string[]; // Account codes
      calculation?: 'sum' | 'difference' | 'custom';
      format?: 'currency' | 'percentage' | 'number';
    }>;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface OHADAAnalyticalAccount {
  _id: string;
  code: string;
  name: string;
  type: 'cost_center' | 'profit_center' | 'project' | 'department';
  parentCode?: string;
  isActive: boolean;
  budget?: number;
  actualAmount?: number;
  variance?: number;
  createdAt: string;
}

export interface OHADABudget {
  _id: string;
  name: string;
  year: number;
  status: 'draft' | 'approved' | 'active' | 'closed';
  lines: Array<{
    accountCode: string;
    accountName: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  }>;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  branch: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Extended OHADA types for tuition integration
export interface OHADATuitionAccount {
  code: string;
  name: string;
  type: 'registration_fee' | 'tuition_fee' | 'exam_fee' | 'library_fee' | 'other_fee';
  isActive: boolean;
  description?: string;
}

export interface OHADATuitionJournalEntry extends Omit<OHADAJournalEntry, 'lines'> {
  lines: Array<{
    account: OHADAAccount | string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description?: string;
    studentReference?: string;
    installmentKey?: string;
  }>;
  studentPayment?: {
    studentId: string;
    studentName: string;
    installmentKey: string;
    installmentLabel: string;
  };
}