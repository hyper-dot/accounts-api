import express from "express";
import {
  createInvoiceForVendor,
  getAllInvoices,
  getInvoicesByVendorId,
  getInvoiceById,
  makePayment,
} from "./invoice.controller";

const router = express.Router();

router.get("/", getAllInvoices);

router.get("/:invoice_id", getInvoiceById);

router.post("/:invoice_id/payment", makePayment);

router.get("/vendor/:vendor_id", getInvoicesByVendorId);

router.post("/vendor/:vendor_id", createInvoiceForVendor);

export default router;
