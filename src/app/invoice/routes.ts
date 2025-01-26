import express from "express";
import { db } from "../../db";

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
  const { description, date, amount } = req.body;
  const vendorId = req.params.vendor_id;

  if (!description || !date || !amount) {
    res
      .status(400)
      .json({ error: "Description, date and amount are required" });
    return;
  }

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

    const vendor = await db.get("SELECT id FROM vendor WHERE id = ?", [
      vendorId,
    ]);

    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    const id = await db.run(
      "INSERT INTO invoice (description, date, amount, vendor_id) VALUES (?, ?, ?, ?)",
      [description, date, amount, vendorId]
    );

    res.json({
      id,
      description,
      date,
      amount,
      vendor_id: vendorId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM invoice WHERE id = ?", [
      req.params.id,
    ]);

    if (!row) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
