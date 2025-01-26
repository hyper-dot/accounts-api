import express from "express";
import { db } from "../../db";

const router = express.Router();

router.get("/income-statement", async (req, res) => {
  const rows = await db.all("SELECT * FROM income_statement");
  res.json(rows);
});

export default router;
