export type InsertJournalEntryProps = {
  service_date: Date;
  transaction_id: number;
  account: string;
  amount: Number;
  entry_type: "DEBIT" | "CREDIT";
  description: string;
  invoice_id: Number;
  category: "REVENUE" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY";
};
