import express from "express";
import { db } from "../../db";
import { insertJournalEntry } from "../../db/service";

const router = express.Router();

router.get("/", async (req, res) => {
  const rows = await db.all("SELECT * FROM invoice");
  res.json(rows);
});

router.get("/:vendor_id", async (req, res) => {
  const vendorId = req.params.vendor_id;
  try {
    const rows = await db.all("SELECT * FROM invoice WHERE vendor_id = ?", [
      vendorId,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:vendor_id", async (req, res) => {
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
    const purchaseOrder = await db.get(
      "SELECT * FROM purchase_order WHERE is_active = 1 AND vendor_id = ?",
      [vendorId]
    );

    if (!purchaseOrder) {
      res
        .status(404)
        .json({ error: "No active purchase order found for vendor" });
      return;
    }

    const vendor = await db.get("SELECT * FROM vendor WHERE id = ?", [
      vendorId,
    ]);

    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    const invoice_id = await db.run(
      "INSERT INTO invoice (description, issued_date, service_date, amount, vendor_id) VALUES (?, ?, ?, ?, ?)",
      [description, issued_date, service_date, amount, vendorId]
    );

    const transaction_id = Date.now();
    const ACTUAL_AMOUNT = amount;

    // cash account credit
    await insertJournalEntry({
      service_date,
      transaction_id,
      account: "Cash Account",
      amount: ACTUAL_AMOUNT,
      type: "CREDIT",
      description,
      invoice_id,
    });

    // Expense account debit
    await insertJournalEntry({
      service_date,
      transaction_id,
      account: "Expense Account",
      amount: ACTUAL_AMOUNT,
      type: "DEBIT",
      description,
      invoice_id,
    });
    res.json({ message: "Inserted invoice successfully !!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
