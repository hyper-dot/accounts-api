import express from "express";
import { db } from "../../db";
import { insertJournalEntry } from "../../db/service";
import {
  createInvoice,
  getAllInvoices,
  getInvoicesByVendorId,
} from "./invoice.controller";

const router = express.Router();

router.get("/", getAllInvoices);

router.get("/:vendor_id", getInvoicesByVendorId);

router.post("/:vendor_id", createInvoice);

export default router;
