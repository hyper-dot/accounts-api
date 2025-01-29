import { ACCOUNT } from ".";

export type InsertJournalEntryProps = {
  date: string;
  transaction_id: number;
  account: ACCOUNT;
  amount: Number;
  entry_type: "DEBIT" | "CREDIT";
  description: string;
  invoice_id?: Number;
  category: "REVENUE" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY";
  purchase_order_id?: Number;
};
