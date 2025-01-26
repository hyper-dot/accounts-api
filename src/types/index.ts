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
