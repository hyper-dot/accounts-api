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

    const EXPECTED_AMOUNT = purchaseOrder.amount_per_month;
    const ACTUAL_AMOUNT = amount;

    console.log({ EXPECTED_AMOUNT, ACTUAL_AMOUNT });

    if (EXPECTED_AMOUNT > ACTUAL_AMOUNT) {
      // CASE Less than expected
      // Create/update cash account with expected amount
      await db.run(
        `
        INSERT INTO account (name, amount, type, description, vendor_id)
        VALUES ('Cash', ?, 'DEBIT', 'Cash account for invoice payment', ?)
        ON CONFLICT(name) 
        DO UPDATE SET amount = amount + ?`,
        [EXPECTED_AMOUNT, vendorId, EXPECTED_AMOUNT]
      );

      // Get vendor name for account descriptions
      const vendorName = await db.get("SELECT name FROM vendor WHERE id = ?", [
        vendorId,
      ]);

      // Create/update accounts payable with difference amount
      const difference = EXPECTED_AMOUNT - ACTUAL_AMOUNT;
      await db.run(
        `
        INSERT INTO account (name, amount, type, description, vendor_id) 
        VALUES (?, ?, 'DEBIT', 'Accounts payable for vendor', ?)
        ON CONFLICT(name)
        DO UPDATE SET amount = amount + ?`,
        [
          `Accounts Payable (${vendorName.name})`,
          difference,
          vendorId,
          difference,
        ]
      );

      // Create/update vendor account with actual amount
      await db.run(
        `
        INSERT INTO account (name, amount, type, description, vendor_id)
        VALUES (?, ?, 'CREDIT', 'Vendor account', ?)
        ON CONFLICT(name)
        DO UPDATE SET amount = amount + ?`,
        [vendorName.name, ACTUAL_AMOUNT, vendorId, ACTUAL_AMOUNT]
      );
    } else if (EXPECTED_AMOUNT < ACTUAL_AMOUNT) {
      // CASE More than expected
    } else {
      // CASE Equal
    }
    //   const id = await db.run(
    //     "INSERT INTO invoice (description, date, amount, vendor_id) VALUES (?, ?, ?, ?)",
    //     [description, date, amount, vendorId]
    //   );
    //
    //   res.json({
    //     id,
    //     description,
    //     date,
    //     amount,
    //     vendor_id: vendorId,
    //   });
    res.json({});
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
