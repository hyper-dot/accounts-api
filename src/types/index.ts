export interface Account {
  account: string;
  balance: number;
}

export interface IncomeStatement {
  revenues: Account[];
  expenses: Account[];
  totalRevenues: number;
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheet {
  assets: Account[];
  liabilities: Account[];
  equity: Account[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface Invoice {
  description: string;
  issued_date: string;
  service_date_start: string;
  service_date_end: string;
  amount: number;
  purchase_order_id: number;
  status: string;
}

export enum ACCOUNT {
  CASH_ACCOUNT = "Cash Account",
  BANK_ACCOUNT = "Bank Account",
  ACCOUNTS_RECEIVABLE = "Accounts Receivable",
  ACCOUNTS_PAYABLE = "Accounts Payable",
  ACCRUED_LIABILITIES = "Accrued Liabilities",
  ADVANCE_PAYMENT = "Advance Payment",
  EQUITY = "Equity",
  REVENUE_ACCOUNT = "Revenue Account",
  EXPENSE_ACCOUNT = "Expense Account",
}

export enum FREQUENCY {
  ONE_TIME = "ONE_TIME",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  BI_ANNUALLY = "BI_ANNUALLY",
  ANNUALLY = "ANNUALLY",
}
