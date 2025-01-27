import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoicesByVendorId,
  getInvoiceById,
  makePayment,
} from "./invoice.controller";

const router = express.Router();

router.get("/", getAllInvoices);

router.get("/:invoice_id", getInvoiceById);

router.get("/vendor/:vendor_id", getInvoicesByVendorId);

router.post("/vendor/:vendor_id", createInvoice);

router.post("/:invoice_id/payment", makePayment);

export default router;
