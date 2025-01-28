import dotenv from "dotenv";
dotenv.config();
import {
  clearTables,
  createTables,
  seedDatabase,
} from "../../utils/test.utils";
import request from "supertest";
import { app } from "../../index";

describe("Invoice Controller", () => {
  beforeEach(async () => {
    await clearTables();
    await createTables();
    await seedDatabase();
  });

  it("should create an invoice", async () => {
    // First verify the vendor exists
    const vendorResponse = await request(app)
      .get("/vendors/1")
      .set("Content-Type", "application/json");

    expect(vendorResponse.status).toBe(200);

    const mockRequest = {
      description: "Azure Cloud Services for January",
      issued_date: "2025-01-25",
      service_date: "2025-01-01",
      amount: 1000,
      status: "UNPAID",
      purchase_order_id: 1,
    };

    const response = await request(app)
      .post("/invoices/vendor/1")
      .send(mockRequest)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
  });

  it("If I add invoice of 900, it should generate accurate balance sheet", async () => {
    // First verify the vendor exists
    const vendorResponse = await request(app)
      .get("/vendors/1")
      .set("Content-Type", "application/json");
    expect(vendorResponse.status).toBe(200);

    const mockRequest = {
      service_date: "2025-01-20",
      issued_date: "2025-02-01",
      amount: 900,
      description: "Invoice for JAN from Microsoft",
      status: "UNPAID",
    };

    const response = await request(app)
      .post("/invoices/vendor/1")
      .send(mockRequest)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);

    const balanceSheetResponse = await request(app)
      .get("/financials/balance-sheet")
      .set("Content-Type", "application/json");

    expect(balanceSheetResponse.status).toBe(200);
    expect(balanceSheetResponse.body).toEqual({
      assets: [
        {
          account: "Cash Account",
          category: "ASSET",
          balance: 2000,
        },
      ],
      liabilities: [
        {
          account: "Accounts Payable",
          category: "LIABILITY",
          balance: 900,
        },
        {
          account: "Accrued Liabilities",
          category: "LIABILITY",
          balance: 0,
        },
      ],
      equity: [
        {
          account: "Equity",
          category: "EQUITY",
          balance: 1000,
        },
        {
          account: "Retained Earnings",
          balance: 100,
        },
      ],
      totalAssets: 2000,
      totalLiabilities: 900,
      totalEquity: 1100,
    });
  });

  it("If I add invoice of 1100, it should generate accurate balance sheet", async () => {
    // First verify the vendor exists
    const vendorResponse = await request(app)
      .get("/vendors/1")
      .set("Content-Type", "application/json");
    expect(vendorResponse.status).toBe(200);

    const mockRequest = {
      service_date: "2025-01-20",
      issued_date: "2025-02-01",
      amount: 1100,
      description: "Invoice for JAN from Microsoft",
      status: "UNPAID",
    };

    const response = await request(app)
      .post("/invoices/vendor/1")
      .send(mockRequest)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);

    const balanceSheetResponse = await request(app)
      .get("/financials/balance-sheet")
      .set("Content-Type", "application/json");

    expect(balanceSheetResponse.status).toBe(200);
    expect(balanceSheetResponse.body).toEqual({
      assets: [
        {
          account: "Cash Account",
          category: "ASSET",
          balance: 2000,
        },
      ],
      liabilities: [
        {
          account: "Accounts Payable",
          category: "LIABILITY",
          balance: 1100,
        },
        {
          account: "Accrued Liabilities",
          category: "LIABILITY",
          balance: 0,
        },
      ],
      equity: [
        {
          account: "Equity",
          category: "EQUITY",
          balance: 1000,
        },
        {
          account: "Retained Earnings",
          balance: -100,
        },
      ],
      totalAssets: 2000,
      totalLiabilities: 1100,
      totalEquity: 900,
    });
  });

  it("If I add invoice of 1000, it should generate accurate balance sheet", async () => {
    // First verify the vendor exists
    const vendorResponse = await request(app)
      .get("/vendors/1")
      .set("Content-Type", "application/json");
    expect(vendorResponse.status).toBe(200);

    const mockRequest = {
      service_date: "2025-01-20",
      issued_date: "2025-02-01",
      amount: 1000,
      description: "Invoice for JAN from Microsoft",
      status: "UNPAID",
    };

    const response = await request(app)
      .post("/invoices/vendor/1")
      .send(mockRequest)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);

    const balanceSheetResponse = await request(app)
      .get("/financials/balance-sheet")
      .set("Content-Type", "application/json");

    expect(balanceSheetResponse.status).toBe(200);
    expect(balanceSheetResponse.body).toEqual({
      assets: [
        {
          account: "Cash Account",
          category: "ASSET",
          balance: 2000,
        },
      ],
      liabilities: [
        {
          account: "Accounts Payable",
          category: "LIABILITY",
          balance: 1000,
        },
        {
          account: "Accrued Liabilities",
          category: "LIABILITY",
          balance: 0,
        },
      ],
      equity: [
        {
          account: "Equity",
          category: "EQUITY",
          balance: 1000,
        },
        {
          account: "Retained Earnings",
          balance: 0,
        },
      ],
      totalAssets: 2000,
      totalLiabilities: 1000,
      totalEquity: 1000,
    });
  });

  it("If I add PAID invoice of 900, it should generate accurate balance sheet", async () => {
    const vendorResponse = await request(app)
      .get("/vendors/1")
      .set("Content-Type", "application/json");
    expect(vendorResponse.status).toBe(200);

    const mockRequest = {
      service_date: "2025-01-20",
      issued_date: "2025-02-01",
      amount: 900,
      description: "Invoice for JAN from Microsoft",
      status: "PAID",
    };

    const response = await request(app)
      .post("/invoices/vendor/1")
      .send(mockRequest)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);

    const balanceSheetResponse = await request(app)
      .get("/financials/balance-sheet")
      .set("Content-Type", "application/json");

    expect(balanceSheetResponse.status).toBe(200);
    expect(balanceSheetResponse.body).toEqual({
      assets: [
        {
          account: "Cash Account",
          category: "ASSET",
          balance: 1100, // 2000 - 900
        },
      ],
      liabilities: [
        {
          account: "Accrued Liabilities",
          category: "LIABILITY",
          balance: 0,
        },
      ],
      equity: [
        {
          account: "Equity",
          category: "EQUITY",
          balance: 1000,
        },
        {
          account: "Retained Earnings",
          balance: 100,
        },
      ],
      totalAssets: 1100,
      totalLiabilities: 0,
      totalEquity: 1100,
    });
  });

  afterEach(async () => {
    await clearTables();
  });
});
