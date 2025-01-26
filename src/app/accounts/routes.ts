import express from "express";
import { db } from "../../db";

const router = express.Router();

router.get("/", async (req, res) => {
  const rows = await db.all("SELECT * FROM account");
  res.json(rows);
});

export default router;
