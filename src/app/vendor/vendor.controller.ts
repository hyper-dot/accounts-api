import { db } from "../../db";
import { Request, Response } from "express";
import { ACCOUNT, FREQUENCY } from "../../types";
import { insertJournalEntry } from "../../db/service";

export async function getAllVendors(req: Request, res: Response) {
  try {
    const rows = await db.all("SELECT * FROM vendor");
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export async function createVendor(req: Request, res: Response) {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const id = await db.run("INSERT INTO vendor (name) VALUES (?)", [name]);
    res.json({
      id,
      name,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export async function getVendorById(req: Request, res: Response) {
  try {
    const row = await db.get("SELECT * FROM vendor WHERE id = ?", [
      req.params.id,
    ]);
    if (!row) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export async function getPurchaseOrdersByVendorId(req: Request, res: Response) {
  const vendorId = req.params.id;

  if (!vendorId) {
    res.status(400).json({ error: "Vendor ID is required" });
    return;
  }

  try {
    const rows = await db.all(
      "SELECT * FROM purchase_order WHERE vendor_id = ?",
      [vendorId]
    );
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export async function createPurchaseOrder(req: Request, res: Response) {
  const vendorId = req.params.id;
  const {
    description,
    total_amount,
    start_date,
    end_date,
    frequency,
    advance_payment,
  } = req.body;

  if (!description || !total_amount || !start_date || !end_date || !frequency) {
    res.status(400).json({
      error:
        "Description, total amount, start date, end date and type are required",
    });
    return;
  }

  if (frequency === FREQUENCY.ONE_TIME) {
    if (start_date !== end_date) {
      res.status(400).json({
        error:
          "Start date and end date must be equal for one-time purchase orders",
      });
      return;
    }
  }

  try {
    // const existingPO = await db.get(
    //   "SELECT * FROM purchase_order WHERE is_active = 1 AND vendor_id = ?",
    //   [vendorId]
    // );

    // if (existingPO) {
    //   res.status(400).json({
    //     error: "There is already an active purchase order for this vendor",
    //   });
    //   return;
    // }

    // Calculate months between start and end date
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const monthDiff =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    const calculated_amount = total_amount - (advance_payment || 0);
    const amount_per_month = calculated_amount / monthDiff;

    if (advance_payment) {
      const transaction_id = Date.now();

      await insertJournalEntry({
        account: ACCOUNT.ADVANCE_PAYMENT,
        amount: advance_payment,
        date: start_date,
        description,
        entry_type: "DEBIT",
        transaction_id,
        category: "ASSET",
      });
      await insertJournalEntry({
        account: ACCOUNT.CASH_ACCOUNT,
        amount: advance_payment,
        date: start_date,
        description,
        entry_type: "CREDIT",
        transaction_id,
        category: "ASSET",
      });
    }

    // Insert new purchase order
    const id = await db.run(
      `INSERT INTO purchase_order 
         (vendor_id, description, total_amount, start_date, end_date, amount_per_month, is_active, frequency) 
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        vendorId,
        description,
        calculated_amount,
        start_date,
        end_date,
        amount_per_month,
        frequency,
      ]
    );

    res.json({
      id,
      vendor_id: vendorId,
      description,
      total_amount,
      start_date,
      end_date,
      amount_per_month,
      is_active: true,
      frequency,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}
