import cron from "node-cron";
import { ACCOUNT } from "../types";
import { db } from "../db";
import { insertJournalEntry } from "../db/service";

// Run at midnight (00:00) on the first day of every month
cron.schedule("0 0 1 * *", async () => {
  try {
    console.log("Starting monthly cron job...");

    await monthlyCronJob();

    console.log("Monthly cron job completed successfully");
  } catch (error) {
    console.error("Error in monthly cron job:", error);
  }
});

const monthlyCronJob = async () => {
  const currentDate = new Date();

  // 1. Get all active purchase orders
  const activePurchaseOrders = await db.all(`
    SELECT * FROM purchase_order 
    WHERE status = 'ACTIVE'
  `);

  for (const po of activePurchaseOrders) {
    // 2. Check if invoice exists for current month
    const existingInvoice = await db.get(
      `
      SELECT * FROM invoice 
      WHERE purchase_order_id = ? 
      AND strftime('%Y-%m', service_date) = strftime('%Y-%m', ?)
    `,
      [po.id, currentDate]
    );

    // 3. If no invoice exists, create accrual entry
    if (!existingInvoice) {
      const transaction_id = Date.now();

      // Create debit entry
      await insertJournalEntry({
        date: currentDate,
        transaction_id,
        account: ACCOUNT.EXPENSE_ACCOUNT,
        amount: po.amount_per_month,
        description: `Monthly accrual for PO #${po.id}`,
        category: "EXPENSE",
        entry_type: "DEBIT",
      });

      // Create credit entry
      await insertJournalEntry({
        date: currentDate,
        transaction_id,
        account: ACCOUNT.ACCRUED_LIABILITIES,
        amount: po.amount_per_month,
        description: `Monthly accrual for PO #${po.id}`,
        category: "LIABILITY",
        entry_type: "CREDIT",
      });
    }
  }
};
