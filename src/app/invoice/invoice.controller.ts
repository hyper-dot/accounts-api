import { subMonths, isBefore, isSameMonth } from "date-fns";
import { db } from "../../db";
import { Request, Response } from "express";
import { insertJournalEntry } from "../../db/service";
import {
  getPurchaseOrderByVendor,
  getVendorById,
  insertInvoiceReturningId,
} from "./invoice.service";

export async function getAllInvoices(req: Request, res: Response) {
  const rows = await db.all("SELECT * FROM invoice");
  res.json(rows);
}

export async function getInvoicesByVendorId(req: Request, res: Response) {
  const vendorId = req.params.vendor_id;
  try {
    const rows = await db.all("SELECT * FROM invoice WHERE vendor_id = ?", [
      vendorId,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createInvoice(req: Request, res: Response) {
  const { description, issued_date, amount, service_date } = req.body;
  const vendorId = req.params.vendor_id;

  if (!description || !issued_date || !amount || !service_date) {
    res.status(400).json({
      error: "description, issued_date, service_date and amount are required",
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

    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    const invoice_id = await insertInvoiceReturningId({
      description,
      issued_date,
      service_date,
      amount,
      vendor_id: vendorId,
    });

    const transaction_id = Date.now();
    const ACTUAL_AMOUNT = amount;
    const serviceDate = new Date(service_date);
    const currentDate = new Date("2024-02-27");

    // Get the monthly amount from purchase order
    const monthlyAmount = purchaseOrder.amount_per_month;

    // Handle previous month entries differently
    if (isSameMonth(serviceDate, subMonths(currentDate, 1))) {
      console.log("Previous month");

      // 1. Reverse the original accrual
      await insertJournalEntry({
        service_date,
        transaction_id,
        account: "Accrued Liabilities",
        amount: monthlyAmount,
        description: `Reversing accrual for (${description})`,
        invoice_id,
        category: "LIABILITY",
        entry_type: "DEBIT",
      });

      await insertJournalEntry({
        service_date,
        transaction_id,
        account: "Expense Account",
        amount: monthlyAmount,
        description: `Reversing accrual for (${description})`,
        invoice_id,
        category: "EXPENSE",
        entry_type: "CREDIT",
      });

      // 2. Record the actual expense
      await insertJournalEntry({
        service_date,
        transaction_id,
        account: "Expense Account",
        amount: ACTUAL_AMOUNT,
        description,
        invoice_id,
        category: "EXPENSE",
        entry_type: "DEBIT",
      });

      await insertJournalEntry({
        service_date,
        transaction_id,
        account: "Cash Account",
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
            service_date,
            transaction_id,
            account: "Expense Account",
            amount: difference,
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "EXPENSE",
            entry_type: "DEBIT",
          });

          await insertJournalEntry({
            service_date,
            transaction_id,
            account: "Accrued Liabilities",
            amount: difference,
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "LIABILITY",
            entry_type: "CREDIT",
          });
        } else {
          // Actual amount is less than accrued
          await insertJournalEntry({
            service_date,
            transaction_id,
            account: "Accrued Liabilities",
            amount: Math.abs(difference),
            description: `Adjustment for (${description})`,
            invoice_id,
            category: "LIABILITY",
            entry_type: "DEBIT",
          });

          await insertJournalEntry({
            service_date,
            transaction_id,
            account: "Expense Account",
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
      await insertJournalEntry({
        service_date,
        transaction_id,
        account: "Cash Account",
        amount: ACTUAL_AMOUNT,
        description,
        invoice_id,
        category: "ASSET",
        entry_type: "CREDIT",
      });

      await insertJournalEntry({
        service_date,
        transaction_id,
        account: "Expense Account",
        amount: ACTUAL_AMOUNT,
        entry_type: "DEBIT",
        description,
        invoice_id,
        category: "EXPENSE",
      });
    }

    res.json({ message: "Inserted invoice successfully !!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
