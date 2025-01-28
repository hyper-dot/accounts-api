import { db } from "../db";

export async function clearTables() {
  await db.run("DROP TABLE IF EXISTS journal_entry");
  await db.run("DROP TABLE IF EXISTS invoice");
  await db.run("DROP TABLE IF EXISTS purchase_order");
  await db.run("DROP TABLE IF EXISTS vendor");
}

export async function createTables() {
  // Create vendor table
  await db.run(`
    CREATE TABLE IF NOT EXISTS vendor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create purchase_order table
  await db.run(`
    CREATE TABLE IF NOT EXISTS purchase_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      amount_per_month DECIMAL(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT NOT NULL CHECK (type IN ('RECURRING', 'ONE_TIME')),
      FOREIGN KEY (vendor_id) REFERENCES vendor(id)
    );
  `);

  // Create journal_entry table
  await db.run(`
    CREATE TABLE IF NOT EXISTS journal_entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      account TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
      category TEXT NOT NULL CHECK (category IN ('REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY')),
      description TEXT NOT NULL,
      invoice_id INTEGER NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoice(id)
    );
  `);

  // Create invoice table
  await db.run(`
    CREATE TABLE IF NOT EXISTS invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      description TEXT NOT NULL,
      issued_date DATETIME NOT NULL,
      service_date DATETIME NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PAID', 'UNPAID', 'PARTIAL_PAID')),
      purchase_order_id INTEGER NOT NULL,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id)
    );
  `);
}

export async function seedDatabase() {
  // Insert vendor
  await db.run(`
    INSERT INTO vendor (name) 
    VALUES ('Microsoft')
  `);

  // Insert purchase order
  await db.run(`
    INSERT INTO purchase_order (
      vendor_id,
      description,
      total_amount,
      start_date,
      end_date,
      amount_per_month,
      type
    ) VALUES (
      1,
      'Azure Cloud Services Annual Contract',
      12000.00,
      '2025-01-01',
      '2025-12-31',
      1000.00,
      'RECURRING'
    )
  `);

  // Journal entries can be grouped by transaction
  await db.run(`
    INSERT INTO journal_entry (
      transaction_id, account, amount, entry_type, description, date, category
    ) VALUES (
      1737890842179, 'Cash Account', 1000, 'DEBIT', 'Equity from owner', '2025-01-20', 'ASSET'
    )
  `);

  await db.run(`
    INSERT INTO journal_entry (
      transaction_id, account, amount, entry_type, description, date, category
    ) VALUES (
      1737890842179, 'Equity', 1000, 'CREDIT', 'Equity from owner', '2025-01-20', 'EQUITY'
    )
  `);

  await db.run(`
    INSERT INTO journal_entry (
      transaction_id, account, amount, entry_type, description, date, category
    ) VALUES (
      1737890842180, 'Cash Account', 1000, 'DEBIT', 'Revenue from sales', '2025-01-25', 'ASSET'
    )
  `);

  await db.run(`
    INSERT INTO journal_entry (
      transaction_id, account, amount, entry_type, description, date, category
    ) VALUES (
      1737890842180, 'Sales Account', 1000, 'CREDIT', 'Revenue from sales', '2025-01-25', 'REVENUE'
    )
  `);

  await db.run(`
    INSERT INTO journal_entry (
      transaction_id, account, amount, entry_type, description, date, category
    ) VALUES (
      1737890842181, 'Expense Account', 1000, 'DEBIT', 'Being paid for Azure Cloud Services', '2025-01-25', 'EXPENSE'
    )
  `);

  await db.run(`
    INSERT INTO journal_entry (
      transaction_id, account, amount, entry_type, description, date, category
    ) VALUES (
      1737890842182, 'Accrued Liabilities', 1000, 'CREDIT', 'Being paid for Azure Cloud Services', '2025-01-25', 'LIABILITY'
    )
  `);
}
