import cron from "node-cron";
import { ACCOUNT, FREQUENCY } from "../types";
import { db } from "../db";
import { insertJournalEntry } from "../db/service";
import { format, isAfter, parseISO } from "date-fns";
import { isBefore } from "date-fns";

// // Run at midnight (00:00) on the first day of every month
// cron.schedule("0 0 1 * *", async () => {
//   try {
//     console.log("Starting monthly cron job...");

//     await monthlyCronJob();

//     console.log("Monthly cron job completed successfully");
//   } catch (error) {
//     console.error("Error in monthly cron job:", error);
//   }
// });

export const monthlyCronJob = async (currentDate: Date = new Date()) => {
  const currentDateString = format(currentDate, "yyyy-MM-dd");

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
     * 5. For types quaterly and bi annually check for the invoice and their period current period. Calculate the remaining amount
     *    and add that to accrued exp
     * */

    const startDate = parseISO(po.start_date);
    const endDate = parseISO(po.end_date);
    const currentDateParsed = parseISO(currentDateString);

    // Skip if current date is before start date or after end date
    if (
      isBefore(currentDateParsed, startDate) ||
      isAfter(currentDateParsed, endDate)
    ) {
      continue;
    }

    // Get all prepaid journal entries for this PO
    const prepaidEntries = await db.all(
      `
      SELECT * FROM journal_entry 
      WHERE purchase_order_id = ? AND account = 'ADVANCE_PAYMENT'
    `,
      [po.id]
    );

    // Calculate remaining prepaid amount by summing credits (positive) and debits (negative)
    const prepaidAmount = prepaidEntries.reduce((total, entry) => {
      if (entry.entry_type === "DEBIT") {
        return total + entry.amount;
      } else {
        return total - entry.amount;
      }
    }, 0);

    switch (po.frequency) {
      case FREQUENCY.ONE_TIME:
        // For one-time POs, check if we already have a journal entry
        const hasEntry = await hasJournalEntry(po.id);
        if (!hasEntry) {
          const transaction_id = Date.now();
          const actual_amount = po.total_amount;
          const remainingAmount = actual_amount - prepaidAmount;

          if (remainingAmount <= 0) {
            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ADVANCE_PAYMENT,
              amount: actual_amount,
              entry_type: "CREDIT",
              description: `Accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "ASSET",
            });
          } else {
            if (prepaidAmount > 0) {
              await insertJournalEntry({
                date: currentDateString,
                transaction_id,
                account: ACCOUNT.ADVANCE_PAYMENT,
                amount: prepaidAmount,
                entry_type: "CREDIT",
                description: `Paid for accrual of PO ${po.id}`,
                purchase_order_id: po.id,
                category: "ASSET",
              });
            }

            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ACCRUED_LIABILITIES,
              amount: remainingAmount,
              entry_type: "CREDIT",
              description: `Accrual of PO ${po.id}`,
              purchase_order_id: po.id,
              category: "LIABILITY",
            });
          }

          await insertJournalEntry({
            date: currentDateString,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: po.total_amount,
            entry_type: "DEBIT",
            description: `Accrual for PO ${po.id}`,
            purchase_order_id: po.id,
            category: "EXPENSE",
          });
        }
        break;

      case FREQUENCY.MONTHLY:
        const lastMonthlyInvoice = await getLastInvoice(po.id);
        const monthlyAmount = po.amount_per_month;
        const monthlyRemainingAmount = monthlyAmount - prepaidAmount;

        console.log({ monthlyAmount, monthlyRemainingAmount, prepaidAmount });

        if (
          !lastMonthlyInvoice ||
          isBefore(
            parseISO(lastMonthlyInvoice.service_date_end),
            currentDateParsed
          )
        ) {
          const transaction_id = Date.now();

          if (monthlyRemainingAmount <= 0) {
            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ADVANCE_PAYMENT,
              amount: monthlyAmount,
              entry_type: "CREDIT",
              description: `Monthly accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "ASSET",
            });
          } else {
            if (prepaidAmount > 0) {
              await insertJournalEntry({
                date: currentDateString,
                transaction_id,
                account: ACCOUNT.ADVANCE_PAYMENT,
                amount: prepaidAmount,
                entry_type: "CREDIT",
                description: `Paid for monthly accrual of PO ${po.id}`,
                purchase_order_id: po.id,
                category: "ASSET",
              });
            }

            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ACCRUED_LIABILITIES,
              amount: monthlyRemainingAmount,
              entry_type: "CREDIT",
              description: `Monthly accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "LIABILITY",
            });
          }

          await insertJournalEntry({
            date: currentDateString,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: monthlyAmount,
            entry_type: "DEBIT",
            description: `Monthly accrual for PO ${po.id}`,
            purchase_order_id: po.id,
            category: "EXPENSE",
          });
        }
        break;

      case FREQUENCY.QUARTERLY:
        const quarterlyAmount = Math.floor(po.total_amount / 4);
        const quarterlyRemainingAmount = quarterlyAmount - prepaidAmount;
        const isQuarterMonth = [3, 6, 9, 12].includes(
          currentDateParsed.getMonth() + 1
        );

        if (isQuarterMonth) {
          const transaction_id = Date.now();

          if (quarterlyRemainingAmount <= 0) {
            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ADVANCE_PAYMENT,
              amount: quarterlyAmount,
              entry_type: "CREDIT",
              description: `Quarterly accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "ASSET",
            });
          } else {
            if (prepaidAmount > 0) {
              await insertJournalEntry({
                date: currentDateString,
                transaction_id,
                account: ACCOUNT.ADVANCE_PAYMENT,
                amount: prepaidAmount,
                entry_type: "CREDIT",
                description: `Paid for quarterly accrual of PO ${po.id}`,
                purchase_order_id: po.id,
                category: "ASSET",
              });
            }

            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ACCRUED_LIABILITIES,
              amount: quarterlyRemainingAmount,
              entry_type: "CREDIT",
              description: `Quarterly accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "LIABILITY",
            });
          }

          await insertJournalEntry({
            date: currentDateString,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: quarterlyAmount,
            entry_type: "DEBIT",
            description: `Quarterly accrual for PO ${po.id}`,
            purchase_order_id: po.id,
            category: "EXPENSE",
          });
        }
        break;

      case FREQUENCY.BI_ANNUALLY:
        const biAnnualAmount = Math.floor(po.total_amount / 2);
        const biAnnualRemainingAmount = biAnnualAmount - prepaidAmount;
        const isBiAnnualMonth = [6, 12].includes(
          currentDateParsed.getMonth() + 1
        );

        if (isBiAnnualMonth) {
          const transaction_id = Date.now();

          if (biAnnualRemainingAmount <= 0) {
            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ADVANCE_PAYMENT,
              amount: biAnnualAmount,
              entry_type: "CREDIT",
              description: `Bi-annual accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "ASSET",
            });
          } else {
            if (prepaidAmount > 0) {
              await insertJournalEntry({
                date: currentDateString,
                transaction_id,
                account: ACCOUNT.ADVANCE_PAYMENT,
                amount: prepaidAmount,
                entry_type: "CREDIT",
                description: `Paid for bi-annual accrual of PO ${po.id}`,
                purchase_order_id: po.id,
                category: "ASSET",
              });
            }

            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ACCRUED_LIABILITIES,
              amount: biAnnualRemainingAmount,
              entry_type: "CREDIT",
              description: `Bi-annual accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "LIABILITY",
            });
          }

          await insertJournalEntry({
            date: currentDateString,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: biAnnualAmount,
            entry_type: "DEBIT",
            description: `Bi-annual accrual for PO ${po.id}`,
            purchase_order_id: po.id,
            category: "EXPENSE",
          });
        }
        break;

      case FREQUENCY.ANNUALLY:
        const annualAmount = po.total_amount;
        const annualRemainingAmount = annualAmount - prepaidAmount;
        const isDecember = currentDateParsed.getMonth() + 1 === 12;

        if (isDecember) {
          const transaction_id = Date.now();

          if (annualRemainingAmount <= 0) {
            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ADVANCE_PAYMENT,
              amount: annualAmount,
              entry_type: "CREDIT",
              description: `Annual accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "ASSET",
            });
          } else {
            if (prepaidAmount > 0) {
              await insertJournalEntry({
                date: currentDateString,
                transaction_id,
                account: ACCOUNT.ADVANCE_PAYMENT,
                amount: prepaidAmount,
                entry_type: "CREDIT",
                description: `Paid for annual accrual of PO ${po.id}`,
                purchase_order_id: po.id,
                category: "ASSET",
              });
            }

            await insertJournalEntry({
              date: currentDateString,
              transaction_id,
              account: ACCOUNT.ACCRUED_LIABILITIES,
              amount: annualRemainingAmount,
              entry_type: "CREDIT",
              description: `Annual accrual for PO ${po.id}`,
              purchase_order_id: po.id,
              category: "LIABILITY",
            });
          }

          await insertJournalEntry({
            date: currentDateString,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: annualAmount,
            entry_type: "DEBIT",
            description: `Annual accrual for PO ${po.id}`,
            purchase_order_id: po.id,
            category: "EXPENSE",
          });
        }
        break;
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

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Please provide a date argument in YYYY-MM-DD format");
    process.exit(1);
  }

  const dateArg = args[0];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateArg)) {
    console.error("Date must be in YYYY-MM-DD format");
    process.exit(1);
  }

  monthlyCronJob(new Date(dateArg))
    .then(() => {
      console.log("Monthly cron job completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error running monthly cron job:", error);
      process.exit(1);
    });
}
