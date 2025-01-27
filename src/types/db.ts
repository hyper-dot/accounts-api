import { ACCOUNT } from ".";

export type InsertJournalEntryProps = {
  date: Date;
  transaction_id: number;
  account: ACCOUNT;
  amount: Number;
  entry_type: "DEBIT" | "CREDIT";
  description: string;
  invoice_id?: Number;
  category: "REVENUE" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY";
};
