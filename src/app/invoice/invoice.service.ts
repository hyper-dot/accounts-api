import { db } from "../../db";
import { Invoice } from "../../types";

export async function getPurchaseOrderByVendor(vendorId: string) {
  try {
    const purchaseOrder = await db.get(
      "SELECT * FROM purchase_order WHERE vendor_id = ?",
      [vendorId]
    );
    return purchaseOrder;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getVendorById(vendorId: string) {
  try {
    const vendor = await db.get("SELECT * FROM vendor WHERE id = ?", [
      vendorId,
    ]);
    return vendor;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function insertInvoiceReturningId(invoice: Invoice) {
  const invoiceId = await db.run(
    "INSERT INTO invoice (description, issued_date, service_date, amount, purchase_order_id, status) VALUES (?, ?, ?, ?, ?, ?)",
    [
      invoice.description,
      invoice.issued_date,
      invoice.service_date,
      invoice.amount,
      invoice.purchase_order_id,
      invoice.status,
    ]
  );
  return invoiceId;
}
