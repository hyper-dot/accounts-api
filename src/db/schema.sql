-- vendor table
CREATE TABLE IF NOT EXISTS vendor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- purchase_order table
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

-- Journal entry Table
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
  purchase_order_id INTEGER NULL,

  FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id),
  FOREIGN KEY (invoice_id) REFERENCES invoice(id)
);

-- Invoice table
CREATE TABLE IF NOT EXISTS invoice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  description TEXT NOT NULL,
  issued_date DATETIME NOT NULL,
  service_date_start DATETIME NOT NULL,
  service_date_end DATETIME NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PAID', 'UNPAID', 'PARTIAL_PAID')),

  -- Purchase order id
  purchase_order_id INTEGER NOT NULL,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id)
);
