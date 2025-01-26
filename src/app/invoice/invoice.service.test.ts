import { getPurchaseOrderByVendor } from "./invoice.service";
import { db } from "../../db";

describe("Invoice Service", () => {
  beforeEach(async () => {
    // Clear existing data
    await db.run("DELETE FROM purchase_order");
    await db.run("DELETE FROM vendor");
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
  });
});
