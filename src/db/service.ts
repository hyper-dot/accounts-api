import { db } from ".";
import { InsertJournalEntryProps } from "../types/db";

export async function insertJournalEntry({
  date,
  transaction_id,
  account,
  amount,
  entry_type,
  description,
  invoice_id,
  category,
  purchase_order_id,
}: InsertJournalEntryProps) {
  return await db.run(
    `INSERT INTO journal_entry(date, transaction_id, account, amount, entry_type, category, description, invoice_id, purchase_order_id)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    [
      date,
      transaction_id,
      account,
      amount,
      entry_type,
      category,
      description,
      invoice_id,
      purchase_order_id,
    ]
  );
}
