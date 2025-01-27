import { subMonths, isBefore, isSameMonth } from "date-fns";
import { db } from "../../db";
import { Request, Response } from "express";
import { insertJournalEntry } from "../../db/service";
import {
  getPurchaseOrderByVendor,
  getVendorById,
  insertInvoiceReturningId,
} from "./invoice.service";
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

export async function createInvoiceForVendor(req: Request, res: Response) {
  const { description, issued_date, amount, service_date, status } = req.body;
  const vendorId = req.params.vendor_id;

  if (!description || !issued_date || !amount || !service_date || !status) {
    res.status(400).json({
      error:
        "description, issued_date, service_date, amount and status are required",
    });
    return;
  }

  // First check purchase order
  try {
    const purchaseOrder = await getPurchaseOrderByVendor(vendorId);
    if (!purchaseOrder) {
      res
        .status(404)
        .json({ error: "No active purchase order found for vendor" });
      return;
    }

    // Check if service date falls within purchase order period
    const poStartDate = new Date(purchaseOrder.start_date);
    const poEndDate = new Date(purchaseOrder.end_date);
    const serviceDate = new Date(service_date);

    if (
      isBefore(serviceDate, poStartDate) ||
      isBefore(poEndDate, serviceDate)
    ) {
      res.status(400).json({
        error: "Service date must be within purchase order period",
      });
      return;
    }

    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    const transaction_id = Date.now();
    const ACTUAL_AMOUNT = amount;
    const currentDate = new Date("2025-02-27");

    // Check if invoice already exists for the service date
    const existingInvoice = await db.get(
      "SELECT * FROM invoice WHERE service_date = ? AND purchase_order_id = ?",
      [service_date, purchaseOrder.id]
    );

    if (existingInvoice) {
      res.status(400).json({
        error:
          "An invoice already exists for this service date and purchase order",
      });
      return;
    }

    const invoice_id = await insertInvoiceReturningId({
      description,
      issued_date,
      service_date,
      amount,
      status,
      purchase_order_id: purchaseOrder.id,
    });

    // Get the monthly amount from purchase order
    const monthlyAmount = purchaseOrder.amount_per_month;
    const isPreviousMonth = isSameMonth(serviceDate, subMonths(currentDate, 1));

    // Handle previous month entries differently
    if (isPreviousMonth) {
      console.log("Previous month");

      // 1. Reverse the original accrual
      await insertJournalEntry({
        date: service_date,
        transaction_id,
        account: ACCOUNT.ACCRUED_LIABILITIES,
        amount: monthlyAmount,
        description: `Reversing accrual for (${description})`,
        invoice_id,
        category: "LIABILITY",
        entry_type: "DEBIT",
      });

      await insertJournalEntry({
        date: service_date,
        transaction_id,
        account: ACCOUNT.EXPENSE_ACCOUNT,
        amount: monthlyAmount,
        description: `Reversing accrual for (${description})`,
        invoice_id,
        category: "EXPENSE",
        entry_type: "CREDIT",
      });

      // 2. Record the actual expense
      await insertJournalEntry({
        date: service_date,
        transaction_id,
        account: ACCOUNT.EXPENSE_ACCOUNT,
        amount: ACTUAL_AMOUNT,
        description,
        invoice_id,
        category: "EXPENSE",
        entry_type: "DEBIT",
      });

      await insertJournalEntry({
        date: service_date,
        transaction_id,
        account: ACCOUNT.CASH_ACCOUNT,
        amount: ACTUAL_AMOUNT,
        description,
        invoice_id,
        category: "ASSET",
        entry_type: "CREDIT",
      });

      // 3. Adjust the difference if actual amount differs from monthly amount
      const difference = ACTUAL_AMOUNT - monthlyAmount;
      if (difference !== 0) {
        if (difference > 0) {
          // Actual amount is greater than accrued
          await insertJournalEntry({
            date: service_date,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: difference,
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "EXPENSE",
            entry_type: "DEBIT",
          });

          await insertJournalEntry({
            date: service_date,
            transaction_id,
            account: ACCOUNT.ACCRUED_LIABILITIES,
            amount: difference,
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "LIABILITY",
            entry_type: "CREDIT",
          });
        } else {
          // Actual amount is less than accrued
          await insertJournalEntry({
            date: service_date,
            transaction_id,
            account: ACCOUNT.ACCRUED_LIABILITIES,
            amount: Math.abs(difference),
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "LIABILITY",
            entry_type: "DEBIT",
          });

          await insertJournalEntry({
            date: service_date,
            transaction_id,
            account: ACCOUNT.EXPENSE_ACCOUNT,
            amount: Math.abs(difference),
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "EXPENSE",
            entry_type: "CREDIT",
          });
        }
      }
    } else {
      // Current month entries (existing logic)
      console.log("Current month");

      if (status === "PAID") {
        await insertJournalEntry({
          date: service_date,
          transaction_id,
          account: ACCOUNT.CASH_ACCOUNT,
          amount: ACTUAL_AMOUNT,
          description,
          invoice_id,
          category: "ASSET",
          entry_type: "CREDIT",
        });
      } else {
        await insertJournalEntry({
          date: service_date,
          transaction_id,
          account: ACCOUNT.ACCOUNTS_PAYABLE,
          amount: ACTUAL_AMOUNT,
          description,
          invoice_id,
          category: "LIABILITY",
          entry_type: "CREDIT",
        });
      }

      await insertJournalEntry({
        date: service_date,
        transaction_id,
        account: ACCOUNT.EXPENSE_ACCOUNT,
        amount: ACTUAL_AMOUNT,
        entry_type: "DEBIT",
        description,
        invoice_id,
        category: "EXPENSE",
      });
    }

    res.json({ message: "Inserted invoice successfully !!" });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
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
