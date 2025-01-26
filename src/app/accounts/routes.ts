import express from "express";
import { db } from "../../db";

const router = express.Router();

router.get("/", async (req, res) => {
  const rows = await db.all("SELECT * FROM journal_entry");
  res.json(rows);
});

export default router;
