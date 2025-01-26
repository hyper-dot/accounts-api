import { generateIncomeStatement } from "./financials.controller";
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
        (2, 'Expenses', 600, 'DEBIT', 'Test expense', '2024-01-01', 'EXPENSE')
      `);

      const statement = await generateIncomeStatement();

      expect(statement.totalRevenues).toBe(1000);
      expect(statement.totalExpenses).toBe(600);
      expect(statement.netIncome).toBe(400);
    });
  });
});
