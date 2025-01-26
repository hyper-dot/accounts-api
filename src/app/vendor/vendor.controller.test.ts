import request from "supertest";
import express from "express";
import vendorRoutes from "./vendor.routes";
import { db } from "../../db";

const app = express();
app.use(express.json());
app.use("/vendors", vendorRoutes);

describe("Vendor Controller", () => {
  beforeEach(async () => {
    // Drop existing tables in correct order (children first)
    await db.run("DROP TABLE IF EXISTS journal_entry");
    await db.run("DROP TABLE IF EXISTS invoice");
    await db.run("DROP TABLE IF EXISTS purchase_order");
    await db.run("DROP TABLE IF EXISTS vendor");

    // Create vendor table
    await db.run(`
      CREATE TABLE vendor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    // Create purchase_order table
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

    // Create invoice table
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

    // Create journal_entry table
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

  describe("POST /vendors", () => {
    it("should create a new vendor", async () => {
      const response = await request(app)
        .post("/vendors")
        .send({ name: "Test Vendor" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Vendor");
    });

    it("should return 400 if name is missing", async () => {
      const response = await request(app).post("/vendors").send({});

      expect(response.status).toBe(400);
    });
  });
});
