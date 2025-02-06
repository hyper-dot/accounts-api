import { db } from "../../db";
import { Request, Response } from "express";
import { FREQUENCY } from "../../types";

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
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const monthDiff =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    const calculated_amount = total_amount - (advance_payment || 0);
    const amount_per_month = calculated_amount / monthDiff;

    // Insert new purchase order
    const id = await db.run(
      `INSERT INTO purchase_order 
         (vendor_id, description, total_amount, start_date, end_date, amount_per_month, is_active, frequency, advance_payment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId,
        description,
        total_amount,
        start_date,
        end_date,
        amount_per_month,
        1,
        frequency,
        advance_payment || 0,
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
