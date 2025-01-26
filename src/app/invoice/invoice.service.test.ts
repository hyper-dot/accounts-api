import {
  getPurchaseOrderByVendor,
  insertInvoiceReturningId,
} from "./invoice.service";
import { db } from "../../db";
import { generateIncomeStatement } from "../financials/financials.controller";

describe("Invoice Service", () => {
  beforeEach(async () => {
    // Clear existing data
    await db.run("DROP TABLE IF EXISTS journal_entry");
    await db.run("DROP TABLE IF EXISTS invoice");
    await db.run("DROP TABLE IF EXISTS purchase_order");
    await db.run("DROP TABLE IF EXISTS vendor");

    // Create tables
    await db.run(`
      CREATE TABLE vendor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    await db.run(`
      CREATE TABLE purchase_order (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        amount_per_month DECIMAL(10,2) NOT NULL,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (vendor_id) REFERENCES vendor(id)
      )
    `);

    await db.run(`
      CREATE TABLE invoice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        issued_date TEXT NOT NULL,
        service_date TEXT NOT NULL,
        FOREIGN KEY (vendor_id) REFERENCES vendor(id)
      )
    `);

    await db.run(`
      CREATE TABLE journal_entry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        account TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        entry_type TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES invoice(id)
      )
    `);
  });

  describe("getPurchaseOrderByVendor", () => {
    it("should return purchase order for valid vendor", async () => {
      // Setup test data
      const vendorResult = await db.run(
        "INSERT INTO vendor (name) VALUES (?)",
        ["Test Vendor"]
      );

      const vendorId = vendorResult;

      await db.run(
        `INSERT INTO purchase_order (
          vendor_id, description, total_amount, 
          start_date, end_date, amount_per_month, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vendorId, "Test PO", 1200, "2024-01-01", "2024-12-31", 100, 1]
      );

      const result = await getPurchaseOrderByVendor(vendorId.toString());

      expect(result).toBeTruthy();
      expect(result.amount_per_month).toBe(100);
    });

    it("should handle previous month accrual and current month actual invoice correctly", async () => {
      // Setup vendor and PO
      const vendorResult = await db.run(
        "INSERT INTO vendor (name) VALUES (?)",
        ["Test Vendor"]
      );
      const vendorId = vendorResult;

      await db.run(
        `INSERT INTO purchase_order (
          vendor_id, description, total_amount,
          start_date, end_date, amount_per_month, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vendorId, "Test PO", 12000, "2024-01-01", "2024-12-31", 1000, 1]
      );

      // Create invoice for January service in February
      const invoiceId = await insertInvoiceReturningId({
        description: "January Service",
        issued_date: "2024-02-05",
        service_date: "2024-01-15",
        amount: 1200,
        vendor_id: vendorId.toString(),
      });

      await db.run(
        `INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type,
          description, date, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          "Expenses",
          1200,
          "DEBIT",
          "January Service",
          "2024-02-05",
          "EXPENSE",
        ]
      );

      // Check income statement after invoice
      const statement = await generateIncomeStatement();

      // Should show $1000 expense for January (accrual)
      // and $200 additional expense for actual invoice difference
      expect(statement.totalExpenses).toBe(1200);
    });

    it("should handle invoice amount higher than accrual correctly", async () => {
      // Setup vendor and PO
      const vendorResult = await db.run(
        "INSERT INTO vendor (name) VALUES (?)",
        ["Test Vendor"]
      );
      const vendorId = vendorResult;

      await db.run(
        `INSERT INTO purchase_order (
          vendor_id, description, total_amount,
          start_date, end_date, amount_per_month, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vendorId, "Test PO", 12000, "2024-01-01", "2024-12-31", 1000, 1]
      );

      // First, create the invoice record
      await db.run(
        `INSERT INTO invoice (
          vendor_id, description, amount, 
          issued_date, service_date
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          vendorId,
          "January Service - Higher Amount",
          1500,
          "2024-02-05",
          "2024-01-15",
        ]
      );

      // Get the last inserted invoice ID
      const result = await db.get("SELECT last_insert_rowid() as id");
      const invoiceId = result.id;

      // Add DEBIT entry
      await db.run(
        `INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type,
          description, date, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          "Expenses",
          1500,
          "DEBIT",
          "January Service - Higher Amount",
          "2024-02-05",
          "EXPENSE",
        ]
      );

      // Add corresponding CREDIT entry
      await db.run(
        `INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type,
          description, date, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          "Accounts Payable",
          1500,
          "CREDIT",
          "January Service - Higher Amount",
          "2024-02-05",
          "LIABILITY",
        ]
      );

      const statement = await generateIncomeStatement();
      expect(statement.totalExpenses).toBe(1500);
    });

    it("should handle invoice amount lower than accrual correctly", async () => {
      // Setup vendor and PO
      const vendorResult = await db.run(
        "INSERT INTO vendor (name) VALUES (?)",
        ["Test Vendor"]
      );
      const vendorId = vendorResult;

      await db.run(
        `INSERT INTO purchase_order (
          vendor_id, description, total_amount,
          start_date, end_date, amount_per_month, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vendorId, "Test PO", 12000, "2024-01-01", "2024-12-31", 1000, 1]
      );

      // First, create the invoice record
      await db.run(
        `INSERT INTO invoice (
          vendor_id, description, amount, 
          issued_date, service_date
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          vendorId,
          "January Service - Lower Amount",
          800,
          "2024-02-05",
          "2024-01-15",
        ]
      );

      // Get the last inserted invoice ID
      const result = await db.get("SELECT last_insert_rowid() as id");
      const invoiceId = result.id;

      // Add DEBIT entry
      await db.run(
        `INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type,
          description, date, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          "Expenses",
          800,
          "DEBIT",
          "January Service - Lower Amount",
          "2024-02-05",
          "EXPENSE",
        ]
      );

      // Add corresponding CREDIT entry
      await db.run(
        `INSERT INTO journal_entry (
          transaction_id, account, amount, entry_type,
          description, date, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          "Accounts Payable",
          800,
          "CREDIT",
          "January Service - Lower Amount",
          "2024-02-05",
          "LIABILITY",
        ]
      );

      const statement = await generateIncomeStatement();
      expect(statement.totalExpenses).toBe(800);
    });
  });
});
