import { Request, Response } from "express";
import {
  getJournalEntries,
  generateIncomeStatement,
  generateBalanceSheet,
  getAccounts,
  getIncomeStatement,
  getBalanceSheet,
} from "./financials.controller";
import { db } from "../../db";
import { clearTables, createTables } from "../../utils/test.utils";

describe("Financial Controller", () => {
  beforeEach(async () => {
    // Drop existing tables in correct order
    await clearTables();
    await createTables();
  });

  describe("getJournalEntries", () => {
    it("should return all journal entries", async () => {
      // Insert test data
      await db.run(`
        INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type, 
          description, date, category
        ) VALUES 
        (1, 'Cash', 1000, 'DEBIT', 'Test entry', '2024-01-01', 'ASSET')
      `);

      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
      };

      await getJournalEntries(
        mockReq as Request,
        mockRes as unknown as Response
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            account: "Cash",
            amount: 1000,
          }),
        ])
      );
    });

    it("should return empty array when no entries exist", async () => {
      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
      };

      await getJournalEntries(
        mockReq as Request,
        mockRes as unknown as Response
      );
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getAccounts", () => {
    it("should return accounts with their entries", async () => {
      // Insert test data with transaction_id
      await db.run(`
        INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type, 
          description, date, category
        ) VALUES 
        (1, 'Cash', 1000, 'DEBIT', 'Test entry', '2024-01-01', 'ASSET'),
        (1, 'Cash', 500, 'CREDIT', 'Test entry 2', '2024-01-02', 'ASSET')
      `);

      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
      };

      await getAccounts(mockReq as Request, mockRes as unknown as Response);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            account: "Cash",
            debit: 1000,
            credit: 500,
            entries: expect.arrayContaining([
              expect.objectContaining({
                date: "2024-01-01",
                description: "Test entry",
                entry_type: "DEBIT",
                amount: 1000,
              }),
              expect.objectContaining({
                date: "2024-01-02",
                description: "Test entry 2",
                entry_type: "CREDIT",
                amount: 500,
              }),
            ]),
          }),
        ])
      );
    });
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

    it("should handle empty data", async () => {
      const statement = await generateIncomeStatement();

      expect(statement.totalRevenues).toBe(0);
      expect(statement.totalExpenses).toBe(0);
      expect(statement.netIncome).toBe(0);
      expect(statement.revenues).toHaveLength(0);
      expect(statement.expenses).toHaveLength(0);
    });

    it("should handle negative revenues and expenses", async () => {
      await db.run(`
        INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type, 
          description, date, category
        ) VALUES 
        (1, 'Sales Returns', 200, 'DEBIT', 'Return', '2024-01-01', 'REVENUE'),
        (2, 'Expense Refund', 100, 'CREDIT', 'Refund', '2024-01-01', 'EXPENSE')
      `);

      const statement = await generateIncomeStatement();
      expect(statement.totalRevenues).toBe(-200);
      expect(statement.totalExpenses).toBe(-100);
      expect(statement.netIncome).toBe(-100);
    });
  });

  describe("getIncomeStatement", () => {
    it("should return income statement via API", async () => {
      const mockReq = {
        query: {},
      };
      const mockRes = {
        json: jest.fn(),
      };

      await getIncomeStatement(
        mockReq as Request,
        mockRes as unknown as Response
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          revenues: expect.any(Array),
          expenses: expect.any(Array),
          totalRevenues: expect.any(Number),
          totalExpenses: expect.any(Number),
          netIncome: expect.any(Number),
        })
      );
    });

    it("should handle errors gracefully", async () => {
      // Drop the table to simulate an error
      await db.run("DROP TABLE journal_entry");

      const mockReq = {
        query: {},
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getIncomeStatement(
        mockReq as Request,
        mockRes as unknown as Response
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
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

    it("should handle empty data", async () => {
      const balanceSheet = await generateBalanceSheet();

      expect(balanceSheet.totalAssets).toBe(0);
      expect(balanceSheet.totalLiabilities).toBe(0);
      expect(balanceSheet.totalEquity).toBe(0);
      expect(balanceSheet.assets).toHaveLength(0);
      expect(balanceSheet.liabilities).toHaveLength(0);
      expect(balanceSheet.equity).toHaveLength(1); // Retained Earnings will always be present
    });

    it("should include retained earnings from income statement", async () => {
      // Insert revenue and expense to generate retained earnings
      await db.run(`
        INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type, 
          description, date, category
        ) VALUES 
        (1, 'Sales', 1000, 'CREDIT', 'Test sale', '2024-01-01', 'REVENUE'),
        (2, 'Expenses', 600, 'DEBIT', 'Test expense', '2024-01-01', 'EXPENSE')
      `);

      const balanceSheet = await generateBalanceSheet();
      const retainedEarnings = balanceSheet.equity.find(
        (e) => e.account === "Retained Earnings"
      );
      expect(retainedEarnings?.balance).toBe(400); // 1000 - 600
    });
  });

  describe("getBalanceSheet", () => {
    it("should return balance sheet via API", async () => {
      const mockReq = {
        query: {},
      };
      const mockRes = {
        json: jest.fn(),
      };

      await getBalanceSheet(mockReq as Request, mockRes as unknown as Response);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          assets: expect.any(Array),
          liabilities: expect.any(Array),
          equity: expect.any(Array),
          totalAssets: expect.any(Number),
          totalLiabilities: expect.any(Number),
          totalEquity: expect.any(Number),
        })
      );
    });

    it("should handle errors gracefully", async () => {
      // Drop the table to simulate an error
      await db.run("DROP TABLE journal_entry");

      const mockReq = {
        query: {},
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getBalanceSheet(mockReq as Request, mockRes as unknown as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });
});
