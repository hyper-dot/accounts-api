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

    const vendor = await db.get("SELECT * FROM vendor WHERE id = ?", [
      vendorId,
    ]);

    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    const invoiceId = await db.run(
      "INSERT INTO invoice (description, date, amount, vendor_id) VALUES (?, ?, ?, ?)",
      [description, date, amount, vendorId]
    );

    const EXPECTED_AMOUNT = purchaseOrder.amount_per_month;
    const ACTUAL_AMOUNT = amount;

    if (ACTUAL_AMOUNT < EXPECTED_AMOUNT) {
      /* IN CASE ACTUAL AMOUNT IS LESS THAN EXPECTED AMOUNT
       * Lets say we expected 100 and got bill of 80
       * 1. First recognize the expense as 100
       * 2. Then credit it in cash account description being (Invoice from vendor name) 100
       * 3. Then debit it in Vendor Account with 80
       * 4. At last it should debit it in Prepaid Acount(vendor) by 20
       * */
      const difference = EXPECTED_AMOUNT - ACTUAL_AMOUNT;

      // 1. Recognize expense
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Expense Account`,
          EXPECTED_AMOUNT,
          "DEBIT",
          `Invoice expense from vendor ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );

      // 2. Credit cash account
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Cash Account`,
          EXPECTED_AMOUNT,
          "CREDIT",
          `Invoice from vendor ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );

      // 4. Debit prepaid account
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Prepaid Account`,
          difference,
          "DEBIT",
          `Prepaid amount for vendor ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );
    } else if (ACTUAL_AMOUNT > EXPECTED_AMOUNT) {
      /* IN CASE OF ACTUAL AMOUNT IS GREATER THAN EXPECTED AMOUNT
       * Lets say we expected 100 and got bill of 120
       * 1. First we recognize 100 as expenses
       * 2. Then credit it in cash account description being (Invoice from vendor name) 100
       * 3. Then credit 20 in Account Payable (vendor name) by 20 () 100
       * 4. Then debit actual amount that is 120 in Cash Account description (Invoice from vendor name)
       * */
      const difference = ACTUAL_AMOUNT - EXPECTED_AMOUNT;

      // 1. Recognize expense
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Expense Account`,
          EXPECTED_AMOUNT,
          "DEBIT",
          `Invoice expense from ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );

      // 3. Credit accounts payable
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Account Payable`,
          difference,
          "CREDIT",
          `Additional payable for ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );

      // 4. Debit cash account for actual amount
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Cash Account`,
          ACTUAL_AMOUNT,
          "DEBIT",
          `Invoice from ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );
    } else {
      /* IN CASE OF ACTUAL AMOUNT IS EQUAL TO EXPECTED AMOUNT
       * 1. First recognize that as an expense
       * 2. Then credit it in CASH account description being (Invoice from vendor name)
       * 3. Then debit it in Vendor account description being (Invoice from vendor name)
       * */
      // 1. Recognize expense
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Expense Account`,
          ACTUAL_AMOUNT,
          "DEBIT",
          `Invoice expense from ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );

      // 2. Credit cash account
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `Cash Account`,
          ACTUAL_AMOUNT,
          "CREDIT",
          `Invoice from ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );

      // 3. Debit vendor account
      await db.run(
        "INSERT INTO account (name, amount, type, description, vendor_id, invoice_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `${vendor.name} Account`,
          ACTUAL_AMOUNT,
          "DEBIT",
          `Invoice from ${vendor.name}`,
          vendorId,
          invoiceId,
        ]
      );
    }
    res.json({ message: "Invoice created successfully" });
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
