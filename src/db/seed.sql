INSERT INTO vendor (name) VALUES ('Microsoft');
INSERT INTO purchase_order (
    vendor_id,
    description,
    total_amount,
    start_date,
    end_date,
    amount_per_month,
    type
) VALUES (
    1, -- references the Microsoft vendor we just created
    'Azure Cloud Services Annual Contract',
    12000.00,
    '2025-01-01',
    '2025-12-31',
    1000.00,
    'RECURRING'
);

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842179, 'Cash Account', 1000, 'DEBIT', 'Equity from owner', '2025-01-20', 'ASSET');

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842179, 'Equity', 1000, 'CREDIT', 'Equity from owner', '2025-01-20', 'EQUITY');

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842180, 'Cash Account', 1000, 'DEBIT', 'Revenue from sales', '2025-01-25', 'ASSET');

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842180, 'Sales Account', 1000, 'CREDIT', 'Revenue from sales', '2025-01-25', 'REVENUE');


INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842181, 'Expense Account', 1000, 'DEBIT', 'Being paid for Azure Cloud Services - January', '2025-01-30', 'EXPENSE', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842182, 'Accrued Liabilities', 1000, 'CREDIT', 'Being paid for Azure Cloud Services - January', '2025-01-30', 'LIABILITY', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842183, 'Expense Account', 1000, 'DEBIT', 'Being paid for Azure Cloud Services - February', '2025-02-28', 'EXPENSE', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842184, 'Accrued Liabilities', 1000, 'CREDIT', 'Being paid for Azure Cloud Services - February', '2025-02-28', 'LIABILITY', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842185, 'Expense Account', 1000, 'DEBIT', 'Being paid for Azure Cloud Services - March', '2025-03-30', 'EXPENSE', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842186, 'Accrued Liabilities', 1000, 'CREDIT', 'Being paid for Azure Cloud Services - March', '2025-03-30', 'LIABILITY', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842187, 'Expense Account', 1000, 'DEBIT', 'Being paid for Azure Cloud Services - April', '2025-04-30', 'EXPENSE', 1);

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category, purchase_order_id)
VALUES (1737890842188, 'Accrued Liabilities', 1000, 'CREDIT', 'Being paid for Azure Cloud Services - April', '2025-04-30', 'LIABILITY', 1);
