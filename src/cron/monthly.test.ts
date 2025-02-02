import { db } from "../db";
import { createTables, seedDatabase } from "../utils/test.utils";
import { clearTables } from "../utils/test.utils";
import { monthlyCronJob } from "./monthly";

describe("Monthly Cron Job", () => {
  beforeEach(async () => {
    await createTables();
    await seedDatabase();
  });

  afterEach(async () => {
    await clearTables();
  });

  it("should create journal entries for accrued expenses for each month", async () => {
    const months = [
      "2025-01-31",
      "2025-02-28",
      "2025-03-31",
      "2025-04-30",
      "2025-05-31",
      "2025-06-30",
      "2025-07-31",
      "2025-08-31",
      "2025-09-30",
      "2025-10-31",
      "2025-11-30",
      "2025-12-31",
    ];

    for (const month of months) {
      await monthlyCronJob(new Date(month));
    }

    const entries = await db.all(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total_amount
      FROM journal_entry 
      WHERE account = 'Accrued Liabilities'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `);
    console.log(entries);
  });
});
