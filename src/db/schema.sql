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
  FOREIGN KEY (vendor_id) REFERENCES vendor(id)
);

-- Journal entry Table
CREATE TABLE IF NOT EXISTS journal_entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  account TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
  description TEXT NOT NULL,

  invoice_id INTEGER NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoice(id)
);

-- Invoice table
CREATE TABLE IF NOT EXISTS invoice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  issued_date DATETIME NOT NULL,
  service_date DATETIME NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  vendor_id INTEGER NOT NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendor(id)
);


-- Seed data 
INSERT INTO vendor (name) VALUES ('Microsoft');

INSERT INTO purchase_order (
    vendor_id,
    description,
    total_amount,
    start_date,
    end_date,
    amount_per_month
) VALUES (
    1, -- references the Microsoft vendor we just created
    'Azure Cloud Services Annual Contract',
    12000.00,
    '2025-01-01',
    '2025-12-31',
    1000.00
);
