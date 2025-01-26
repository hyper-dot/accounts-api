import request from "supertest";
import express from "express";
import vendorRoutes from "./vendor.routes";
import { db } from "../../db";

const app = express();
app.use(express.json());
app.use("/vendors", vendorRoutes);

describe("Vendor Controller", () => {
  beforeEach(async () => {
    await db.run("DELETE FROM vendor");
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
