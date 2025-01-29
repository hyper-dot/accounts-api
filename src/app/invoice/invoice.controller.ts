import { db } from "../../db";
import { Request, Response } from "express";
import { insertJournalEntry } from "../../db/service";
import { insertInvoiceReturningId } from "./invoice.service";
import { ACCOUNT } from "../../types";

export async function getAllInvoices(req: Request, res: Response) {
  const rows = await db.all("SELECT * FROM invoice");
  res.json(rows);
}

export async function getInvoiceById(req: Request, res: Response) {
  const invoiceId = req.params.invoice_id;
  const invoice = await db.get("SELECT * FROM invoice WHERE id = ?", [
    invoiceId,
  ]);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(invoice);
}

export async function getInvoicesByVendorId(req: Request, res: Response) {
  const vendorId = req.params.vendor_id;
  try {
    // Join with purchase_order to get invoices for vendor through purchase_order_id
    const rows = await db.all(
      `
      SELECT i.* 
      FROM invoice i
      JOIN purchase_order po ON i.purchase_order_id = po.id 
      WHERE po.vendor_id = ?
    `,
      [vendorId]
    );
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}

// export async function createInvoiceForVendor(req: Request, res: Response) {
//   const { description, issued_date, amount, service_date, status } = req.body;
//   const vendorId = req.params.vendor_id;

//   if (!description || !issued_date || !amount || !service_date || !status) {
//     res.status(400).json({
//       error:
//         "description, issued_date, service_date, amount and status are required",
//     });
//     return;
//   }

//   // First check purchase order
//   try {
//     const purchaseOrder = await getPurchaseOrderByVendor(vendorId);
//     if (!purchaseOrder) {
//       res
//         .status(404)
//         .json({ error: "No active purchase order found for vendor" });
//       return;
//     }

//     // Check if service date falls within purchase order period
//     const poStartDate = new Date(purchaseOrder.start_date);
//     const poEndDate = new Date(purchaseOrder.end_date);
//     const serviceDate = new Date(service_date);

//     if (
//       isBefore(serviceDate, poStartDate) ||
//       isBefore(poEndDate, serviceDate)
//     ) {
//       res.status(400).json({
//         error: "Service date must be within purchase order period",
//       });
//       return;
//     }

//     // Check if vendor exists
//     const vendor = await getVendorById(vendorId);
//     if (!vendor) {
//       res.status(404).json({ error: "Vendor not found" });
//       return;
//     }

//     const transaction_id = Date.now();
//     const ACTUAL_AMOUNT = amount;
//     const currentDate = new Date("2025-02-27");

//     // Check if invoice already exists for the service date
//     const existingInvoice = await db.get(
//       "SELECT * FROM invoice WHERE service_date = ? AND purchase_order_id = ?",
//       [service_date, purchaseOrder.id]
//     );

//     if (existingInvoice) {
//       res.status(400).json({
//         error:
//           "An invoice already exists for this service date and purchase order",
//       });
//       return;
//     }

//     const invoice_id = await insertInvoiceReturningId({
//       description,
//       issued_date,
//       service_date,
//       amount,
//       status,
//       purchase_order_id: purchaseOrder.id,
//     });

//     // Get the monthly amount from purchase order
//     const monthlyAmount = purchaseOrder.amount_per_month;
//     const isPreviousMonth = isSameMonth(serviceDate, subMonths(currentDate, 1));

//     // Handle previous month entries differently
//     if (isPreviousMonth) {
//       console.log("Previous month");

//       // 1. Reverse the original accrual
//       await insertJournalEntry({
//         date: service_date,
//         transaction_id,
//         account: ACCOUNT.ACCRUED_LIABILITIES,
//         amount: monthlyAmount,
//         description: `Reversing accrual for (${description})`,
//         invoice_id,
//         category: "LIABILITY",
//         entry_type: "DEBIT",
//       });

//       await insertJournalEntry({
//         date: service_date,
//         transaction_id,
//         account: ACCOUNT.EXPENSE_ACCOUNT,
//         amount: monthlyAmount,
//         description: `Reversing accrual for (${description})`,
//         invoice_id,
//         category: "EXPENSE",
//         entry_type: "CREDIT",
//       });

//       // 2. Record the actual expense
//       await insertJournalEntry({
//         date: service_date,
//         transaction_id,
//         account: ACCOUNT.EXPENSE_ACCOUNT,
//         amount: ACTUAL_AMOUNT,
//         description,
//         invoice_id,
//         category: "EXPENSE",
//         entry_type: "DEBIT",
//       });

//       if (status === "PAID") {
//         await insertJournalEntry({
//           date: service_date,
//           transaction_id,
//           account: ACCOUNT.CASH_ACCOUNT,
//           amount: ACTUAL_AMOUNT,
//           description,
//           invoice_id,
//           category: "ASSET",
//           entry_type: "CREDIT",
//         });
//       } else {
//         await insertJournalEntry({
//           date: service_date,
//           transaction_id,
//           account: ACCOUNT.ACCOUNTS_PAYABLE,
//           amount: ACTUAL_AMOUNT,
//           description,
//           invoice_id,
//           category: "LIABILITY",
//           entry_type: "CREDIT",
//         });
//       }
//     } else {
//       // Current month entries (existing logic)
//       console.log("Current month");

//       if (status === "PAID") {
//         await insertJournalEntry({
//           date: service_date,
//           transaction_id,
//           account: ACCOUNT.CASH_ACCOUNT,
//           amount: ACTUAL_AMOUNT,
//           description,
//           invoice_id,
//           category: "ASSET",
//           entry_type: "CREDIT",
//         });
//       } else {
//         await insertJournalEntry({
//           date: service_date,
//           transaction_id,
//           account: ACCOUNT.ACCOUNTS_PAYABLE,
//           amount: ACTUAL_AMOUNT,
//           description,
//           invoice_id,
//           category: "LIABILITY",
//           entry_type: "CREDIT",
//         });
//       }

//       await insertJournalEntry({
//         date: service_date,
//         transaction_id,
//         account: ACCOUNT.EXPENSE_ACCOUNT,
//         amount: ACTUAL_AMOUNT,
//         entry_type: "DEBIT",
//         description,
//         invoice_id,
//         category: "EXPENSE",
//       });
//     }

//     res.json({ message: "Inserted invoice successfully !!" });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ error: err instanceof Error ? err.message : "Unknown error" });
//   }
// }

export async function createInvoiceForPO(req: Request, res: Response) {
  const {
    description,
    issued_date,
    amount,
    service_date_start,
    service_date_end,
    status,
  } = req.body;
  const poId = req.params.po_id;

  if (
    !description ||
    !issued_date ||
    !amount ||
    !service_date_start ||
    !service_date_end ||
    !status
  ) {
    res.status(400).json({
      error:
        "description, issued_date, service_date_start, service_date_end, amount and status are required",
    });
    return;
  }

  try {
    // Get purchase order
    const purchaseOrder = await db.get(
      "SELECT * FROM purchase_order WHERE id = ? AND is_active = 1",
      [poId]
    );

    if (!purchaseOrder) {
      res
        .status(404)
        .json({ error: `Active purchase order with id ${poId} not found` });
      return;
    }

    // Get all invoices for this PO
    const existingInvoices = await db.all(
      "SELECT * FROM invoice WHERE purchase_order_id = ?",
      [poId]
    );

    const newStart = new Date(service_date_start);
    const newEnd = new Date(service_date_end);
    const currentDate = new Date().toISOString().split("T")[0];

    // Check for overlapping periods with existing invoices
    const hasOverlap = existingInvoices.some((invoice) => {
      const existingStart = new Date(invoice.service_date_start);
      const existingEnd = new Date(invoice.service_date_end);

      // Check if periods overlap
      return (
        (newStart <= existingEnd && newEnd >= existingStart) ||
        (existingStart <= newEnd && existingEnd >= newStart)
      );
    });

    if (hasOverlap) {
      res.status(400).json({
        error:
          "Service period overlaps with an existing invoice for this purchase order",
      });
      return;
    }
    /* Now next step to keep account if there is no overlaps
     * 1. We have to check whether there is any accrued expenses for the months
     *    - To find about the previous entries we will follow this step
     *    - STEP 1: Find all the journal entries with the related po_id with account
     *    named ACCOUNT.ACCRUED_LIABILITIES and entry_type="CREDIT" that lies within the starting of fiscal year and
     *    service_date_end
     *
     * 2. Then reverse entry it or them
     * 3. Then create new invoice
     */
    // Get fiscal year start date (Jan 1st of current year)
    const fiscalYearStart = `${new Date().getFullYear()}-01-01`;

    // Find accrued liability entries that are CREDIT and lies within the fiscal year start and service_date_end
    const accruedLiabilityEntries = await db.all(
      `SELECT * FROM journal_entry 
       WHERE purchase_order_id = ? 
       AND account = ?
       AND entry_type = 'CREDIT'
       AND date >= ? 
       AND date <= ?`,
      [poId, ACCOUNT.ACCRUED_LIABILITIES, fiscalYearStart, service_date_end]
    );

    // Find expense entries that are DEBIT and lies within the fiscal year start and service_date_end
    const expenseEntries = await db.all(
      `SELECT * FROM journal_entry 
       WHERE purchase_order_id = ? 
       AND account = ?
       AND entry_type = 'DEBIT'
       AND date >= ? 
       AND date <= ?`,
      [poId, ACCOUNT.EXPENSE_ACCOUNT, fiscalYearStart, service_date_end]
    );

    if (accruedLiabilityEntries.length !== expenseEntries.length) {
      res.status(400).json({
        error:
          "Inconsistent journal entries found for accrued liabilities and expenses",
      });
      return;
    }

    const transaction_id = Date.now();

    // Reverse expense entries (DEBIT -> CREDIT)
    for (const entry of expenseEntries) {
      await insertJournalEntry({
        transaction_id,
        date: currentDate,
        account: ACCOUNT.EXPENSE_ACCOUNT,
        amount: entry.amount,
        entry_type: "CREDIT", // Reverse DEBIT to CREDIT
        category: "EXPENSE",
        description: `Reversing expense for PO ${poId}`,
        invoice_id: entry.invoice_id,
        purchase_order_id: Number(poId),
      });
    }

    // Reverse accrued liability entries (CREDIT -> DEBIT)
    for (const entry of accruedLiabilityEntries) {
      await insertJournalEntry({
        transaction_id,
        date: currentDate,
        account: ACCOUNT.ACCRUED_LIABILITIES,
        amount: entry.amount,
        entry_type: "DEBIT", // Reverse CREDIT to DEBIT
        category: "LIABILITY",
        description: `Reversing accrued expense for PO ${poId}`,
        invoice_id: entry.invoice_id,
        purchase_order_id: Number(poId),
      });
    }

    // Create new invoice
    const invoice_id = await insertInvoiceReturningId({
      description,
      issued_date,
      service_date_start,
      service_date_end,
      amount,
      status,
      purchase_order_id: purchaseOrder.id,
    });

    // Create new Journal entries for the invoice
    await insertJournalEntry({
      invoice_id,
      amount,
      account: ACCOUNT.EXPENSE_ACCOUNT,
      entry_type: "DEBIT",
      description: `Invoice for Purchase Order (${purchaseOrder.description})`,
      date: currentDate,
      transaction_id,
      category: "EXPENSE",
      purchase_order_id: Number(poId),
    });

    await insertJournalEntry({
      invoice_id,
      amount,
      account: ACCOUNT.ACCOUNTS_PAYABLE,
      entry_type: "CREDIT",
      description: `Invoice for Purchase Order (${purchaseOrder.description})`,
      date: currentDate,
      transaction_id,
      category: "LIABILITY",
      purchase_order_id: Number(poId),
    });

    res.json({ message: "Invoice created successfully !!" });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function makePayment(req: Request, res: Response) {
  const { invoice_id } = req.params;
  const { amount, date } = req.body;

  const invoice = await db.get("SELECT * FROM invoice WHERE id = ?", [
    invoice_id,
  ]);

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (invoice.status === "PAID") {
    res.status(400).json({ error: "Invoice already paid" });
    return;
  }

  if (amount > invoice.amount) {
    res.status(400).json({ error: "Amount is greater than invoice amount" });
    return;
  }
  // In case of partial payment
  // Check if the invoice has partial payments
  const journalEntries = await db.all(
    "SELECT * FROM journal_entry WHERE invoice_id = ? AND account = 'Cash Account' AND entry_type = 'CREDIT'",
    [invoice_id]
  );

  const partialPayment =
    journalEntries.length === 0
      ? 0
      : journalEntries.reduce((acc, entry) => acc + entry.amount, 0);

  const remainingAmount = invoice.amount - partialPayment;
  const transaction_id = Date.now();

  console.log("PARTIAL PAYMENTS", partialPayment);
  console.log("REMAINING AMOUNT", remainingAmount);

  if (amount > remainingAmount) {
    res.status(400).json({ error: "Amount is greater than remaining amount" });
    return;
  }

  if (amount < remainingAmount) {
    console.log("PARTIAL PAYMENT");
    // Create a journal entry for the partial payment
    await insertJournalEntry({
      invoice_id: invoice.id,
      amount,
      account: ACCOUNT.CASH_ACCOUNT,
      entry_type: "CREDIT",
      description: `Partial payment for invoice (${invoice.description})`,
      date,
      transaction_id,
      category: "ASSET",
    });
    await insertJournalEntry({
      invoice_id: invoice.id,
      amount,
      account: ACCOUNT.ACCOUNTS_PAYABLE,
      entry_type: "DEBIT",
      description: `Partial payment for invoice (${invoice.description})`,
      date,
      transaction_id,
      category: "LIABILITY",
    });
    await db.run("UPDATE invoice SET status = 'PARTIAL_PAID' WHERE id = ?", [
      invoice_id,
    ]);
  } else {
    // Full payment
    console.log("FULL PAYMENT");
    await insertJournalEntry({
      invoice_id: invoice.id,
      amount: amount,
      account: ACCOUNT.CASH_ACCOUNT,
      entry_type: "CREDIT",
      description: `Remaining  payment for invoice (${invoice.description})`,
      date,
      transaction_id,
      category: "ASSET",
    });
    await insertJournalEntry({
      invoice_id: invoice.id,
      amount: amount,
      account: ACCOUNT.ACCOUNTS_PAYABLE,
      entry_type: "DEBIT",
      description: `Remaining  payment for invoice (${invoice.description})`,
      date,
      transaction_id,
      category: "LIABILITY",
    });

    await db.run("UPDATE invoice SET status = 'PAID' WHERE id = ?", [
      invoice_id,
    ]);
  }

  res.json({ message: "Amount paid successfully !!" });
}
