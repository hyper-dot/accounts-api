import { db } from ".";

type Props = {
  service_date: Date;
  group_id: number;
  account: string;
  amount: Number;
  type: "DEBIT" | "CREDIT";
  description: string;
  invoice_id: Number;
};
export async function insertJournalEntry({
  service_date,
  group_id,
  account,
  amount,
  type,
  description,
  invoice_id,
}: Props) {
  return await db.run(
    `INSERT INTO journal_entry(date, group_id, account, amount, type, description, invoice_id)
         VALUES(?, ?, ?, ?, ?, ?, ?)
      `,
    [service_date, group_id, account, amount, type, description, invoice_id],
  );
}
