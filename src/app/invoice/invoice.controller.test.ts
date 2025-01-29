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

  afterEach(async () => {
    await clearTables();
  });
});
