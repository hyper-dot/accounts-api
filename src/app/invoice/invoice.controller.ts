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

    // cash account credit
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

    // Expense account debit
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
    res.json({ message: "Inserted invoice successfully !!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
