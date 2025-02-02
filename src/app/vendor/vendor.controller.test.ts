import request from "supertest";
import { clearTables, createTables } from "../../utils/test.utils";
import { app } from "../../index";

describe("Vendor Controller", () => {
  beforeEach(async () => {
    // Drop existing tables in correct order (children first)
    await clearTables();
    await createTables();
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
