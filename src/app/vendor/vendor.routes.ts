import express from "express";
import {
  createVendor,
  getAllVendors,
  getVendorById,
  getPurchaseOrdersByVendorId,
  createPurchaseOrder,
} from "./vendor.controller";

const router = express.Router();

router.get("/", getAllVendors);

router.post("/", createVendor);

router.get("/:id", getVendorById);

router.get("/:id/purchase-orders", getPurchaseOrdersByVendorId);

router.post("/:id/purchase-orders", createPurchaseOrder);

export default router;
