import express from "express";
import {
  getAllInvoices,
  getInvoicesByVendorId,
  getInvoiceById,
  makePayment,
  createInvoiceForPO,
  createAdvancePayment,
} from "./invoice.controller";

const router = express.Router();

router.get("/", getAllInvoices);

router.get("/:invoice_id", getInvoiceById);

router.post("/:invoice_id/payment", makePayment);

router.get("/vendor/:vendor_id", getInvoicesByVendorId);

router.post("/po/:po_id", createInvoiceForPO);

router.post("/po/:po_id/advance", createAdvancePayment);

export default router;
