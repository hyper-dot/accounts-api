import {
  generateIncomeStatement,
  generateBalanceSheet,
} from "./financials.controller";
import { db } from "../../db";

describe("Financial Controller", () => {
  beforeEach(async () => {
    await db.run("DELETE FROM journal_entry");
  });

  describe("generateIncomeStatement", () => {
    it("should calculate correct totals", async () => {
      // Insert test journal entries
      await db.run(`
        INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type, 
          description, date, category
        ) VALUES 
        (1, 'Sales', 1000, 'CREDIT', 'Test sale', '2024-01-01', 'REVENUE'),
        (2, 'Expenses', 600, 'DEBIT', 'Test expense', '2024-01-01', 'EXPENSE'),
        (3, 'Sales', 1200, 'CREDIT', 'Test sale', '2024-02-01', 'REVENUE'),
        (4, 'Expenses', 800, 'DEBIT', 'Test expense', '2024-02-01', 'EXPENSE'),
        (5, 'Sales', 900, 'CREDIT', 'Test sale', '2024-03-01', 'REVENUE'),
        (6, 'Expenses', 500, 'DEBIT', 'Test expense', '2024-03-01', 'EXPENSE'),
        (7, 'Sales', 1500, 'CREDIT', 'Test sale', '2024-04-01', 'REVENUE'),
        (8, 'Expenses', 700, 'DEBIT', 'Test expense', '2024-04-01', 'EXPENSE'),
        (9, 'Sales', 1100, 'CREDIT', 'Test sale', '2024-05-01', 'REVENUE'),
        (10, 'Expenses', 650, 'DEBIT', 'Test expense', '2024-05-01', 'EXPENSE')
      `);

      const statement = await generateIncomeStatement();

      expect(statement.totalRevenues).toBe(5700); // Sum of all sales: 1000 + 1200 + 900 + 1500 + 1100
      expect(statement.totalExpenses).toBe(3250); // Sum of all expenses: 600 + 800 + 500 + 700 + 650
      expect(statement.netIncome).toBe(2450); // 5700 - 3250
    });
  });

  describe("generateBalanceSheet", () => {
    it("should calculate correct account balances", async () => {
      // Insert test journal entries for balance sheet
      await db.run(`
        INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type,
          description, date, category
        ) VALUES
        (1, 'Cash', 10000, 'DEBIT', 'Initial cash', '2024-01-01', 'ASSET'),
        (2, 'Accounts Receivable', 5000, 'DEBIT', 'Customer invoice', '2024-01-01', 'ASSET'),
        (3, 'Accounts Payable', 3000, 'CREDIT', 'Supplier invoice', '2024-01-01', 'LIABILITY'),
        (4, 'Equipment', 8000, 'DEBIT', 'New equipment', '2024-01-01', 'ASSET'),
        (5, 'Long-term Debt', 15000, 'CREDIT', 'Bank loan', '2024-01-01', 'LIABILITY'),
        (6, 'Common Stock', 5000, 'CREDIT', 'Initial investment', '2024-01-01', 'EQUITY')
      `);

      const balanceSheet = await generateBalanceSheet();

      expect(balanceSheet.totalAssets).toBe(23000); // 10000 + 5000 + 8000
      expect(balanceSheet.totalLiabilities).toBe(18000); // 3000 + 15000
      expect(balanceSheet.totalEquity).toBe(5000);
    });
  });
});
