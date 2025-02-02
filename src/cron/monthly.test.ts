import { createTables } from "../utils/test.utils";
import { clearTables } from "../utils/test.utils";
import { monthlyCronJob } from "./monthly";

describe("Monthly Cron Job", () => {
  beforeAll(async () => {
    await clearTables();
    await createTables();
  });

  it("should create journal entries for accrued expenses", async () => {
    await monthlyCronJob(new Date("2025-02-01"));
  });
});
