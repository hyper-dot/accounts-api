import { db } from ".";

type Props = {
  service_date: Date;
  transaction_id: number;
  account: string;
  amount: Number;
  type: "DEBIT" | "CREDIT";
  description: string;
  invoice_id: Number;
};
export async function insertJournalEntry({
  service_date,
  transaction_id,
  account,
  amount,
  type,
  description,
  invoice_id,
}: Props) {
  return await db.run(
    `INSERT INTO journal_entry(date, transaction_id, account, amount, type, description, invoice_id)
         VALUES(?, ?, ?, ?, ?, ?, ?)
      `,
    [
      service_date,
      transaction_id,
      account,
      amount,
      type,
      description,
      invoice_id,
    ]
  );
}
