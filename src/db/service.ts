import { db } from ".";
import { InsertJournalEntryProps } from "../types/db";

export async function insertJournalEntry({
  service_date,
  transaction_id,
  account,
  amount,
  entry_type,
  description,
  invoice_id,
  category,
}: InsertJournalEntryProps) {
  return await db.run(
    `INSERT INTO journal_entry(date, transaction_id, account, amount, entry_type, category, description, invoice_id)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `,
    [
      service_date,
      transaction_id,
      account,
      amount,
      entry_type,
      category,
      description,
      invoice_id,
    ]
  );
}
