import express from "express";
import vendorRoutes from "./app/vendor/vendor.routes";
import invoiceRoutes from "./app/invoice/invoice.routes";
import financialsRoutes from "./app/financials/financials.routes";

// INIT
export const app = express();
app.use(express.json());

// ROUTES
app.use("/vendors", vendorRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/financials", financialsRoutes);

const PORT = process.env.NODE_ENV === "test" ? 8081 : 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
