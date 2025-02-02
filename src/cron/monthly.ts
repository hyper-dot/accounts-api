import cron from "node-cron";
import { ACCOUNT, FREQUENCY } from "../types";
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

export const monthlyCronJob = async (currentDate: Date = new Date()) => {
  const currentDateString = currentDate.toISOString().split("T")[0];

  // 1. Get all active purchase orders
  const activePurchaseOrders = await db.all(`
    SELECT * FROM purchase_order 
    WHERE is_active = 1
  `);

  for (const po of activePurchaseOrders) {
    /* STEPS TO ADD ACCRUED EXPENSES
     * 1. Get all the purchase orders
     * 2. check their frequency and starting date
     * 3. IF it is one time check if we have any invoice or journal entry
     *    for that particular order if yes ignore that
     * 4. For types Monthly find the invoices that service period overlaps the current month
     *    if found calculate the remaining amount to be paid and add that to accrued exp
     * 5. For types quaterly and bi annually check for the pervious invoice and their period. Calculate the remaining amount
     *    and add that to accrued exp
     * */
    // Check if PO is within its validity period
    if (
      new Date(po.end_date) < currentDate ||
      new Date(po.start_date) > currentDate
    ) {
      continue;
    }

    // Get existing invoices for this PO in the current month
    const existingInvoices = await db.all(
      `
      SELECT * FROM invoice 
      WHERE purchase_order_id = ? 
      AND strftime('%Y-%m', service_date_start) <= strftime('%Y-%m', ?)
      AND strftime('%Y-%m', service_date_end) >= strftime('%Y-%m', ?)
    `,
      [po.id, currentDate.toISOString(), currentDate.toISOString()]
    );

    let accruedAmount = 0;

    switch (po.frequency) {
      case "ONE_TIME":
        // For one-time POs, check if we already have any invoice or journal entry
        const hasEntry =
          existingInvoices.length > 0 || (await hasJournalEntry(po.id));
        if (!hasEntry) {
          accruedAmount = po.total_amount;
        }
        break;

      case "MONTHLY":
        // If no invoice exists for current month, accrue the monthly amount
        if (existingInvoices.length === 0) {
          accruedAmount = po.amount_per_month;
        }
        break;

      case "QUARTERLY":
      case "BI_ANNUALLY":
      case "ANNUALLY":
        const lastInvoice = await getLastInvoice(po.id);
        const frequency = po.frequency as FREQUENCY;

        // Define period lengths in months
        const periodMonths = {
          QUARTERLY: 3,
          BI_ANNUALLY: 6,
          ANNUALLY: 12,
        }[frequency];

        if (lastInvoice) {
          const monthsSinceLastInvoice = getMonthsDifference(
            new Date(lastInvoice.service_date_end),
            currentDate
          );

          // Only accrue if we're still within the same period
          if (monthsSinceLastInvoice < periodMonths) {
            // Calculate the prorated amount for the elapsed months in this period
            accruedAmount =
              (po.total_amount / periodMonths) * monthsSinceLastInvoice;
          }
        } else {
          // If no previous invoice, calculate from start date
          const monthsSinceStart = getMonthsDifference(
            new Date(po.start_date),
            currentDate
          );

          // Calculate the prorated amount for the elapsed months in this period
          const monthsInCurrentPeriod = monthsSinceStart % periodMonths;
          accruedAmount =
            (po.total_amount / periodMonths) * monthsInCurrentPeriod;
        }
        break;
    }
    const transaction_id = Date.now();

    if (accruedAmount > 0) {
      // Create journal entries for accrued expense
      await insertJournalEntry({
        date: currentDateString,
        transaction_id,
        account: ACCOUNT.ACCRUED_LIABILITIES,
        amount: accruedAmount,
        entry_type: "CREDIT",
        category: "LIABILITY",
        description: `Accrued expense for PO #${po.id}`,
        purchase_order_id: po.id,
      });

      await insertJournalEntry({
        date: currentDateString,
        transaction_id,
        account: ACCOUNT.EXPENSE_ACCOUNT,
        amount: accruedAmount,
        entry_type: "DEBIT",
        category: "EXPENSE",
        description: `Accrued expense for PO #${po.id}`,
        purchase_order_id: po.id,
      });
    }
  }
};

// Helper functions
const hasJournalEntry = async (poId: number): Promise<boolean> => {
  const entry = await db.get(
    "SELECT id FROM journal_entry WHERE purchase_order_id = ? LIMIT 1",
    [poId]
  );
  return !!entry;
};

const getLastInvoice = async (poId: number) => {
  return await db.get(
    `
    SELECT * FROM invoice 
    WHERE purchase_order_id = ? 
    ORDER BY service_date_end DESC 
    LIMIT 1
  `,
    [poId]
  );
};

const getMonthsDifference = (startDate: Date, endDate: Date): number => {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth()
  );
};
