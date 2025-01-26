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

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842179, 'Cash Account', 1000, 'DEBIT', 'Equity from owner', '2025-01-20', 'ASSET');

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842179, 'Equity', 1000, 'CREDIT', 'Equity from owner', '2025-01-20', 'EQUITY');

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842180, 'Cash Account', 1000, 'DEBIT', 'Revenue from sales', '2025-01-25', 'ASSET');

INSERT INTO journal_entry (transaction_id, account, amount, entry_type, description, date, category) 
VALUES (1737890842180, 'Sales Account', 1000, 'CREDIT', 'Revenue from sales', '2025-01-25', 'REVENUE');


INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category)
VALUES (1737890842181, 'Expense Account', 1000, 'DEBIT', 'Being paid for Azure Cloud Services', '2025-01-25', 'EXPENSE');

INSERT INTO journal_entry(transaction_id, account, amount, entry_type, description, date, category)
VALUES (1737890842182, 'Accrued Liabilities', 1000, 'CREDIT', 'Being paid for Azure Cloud Services', '2025-01-25', 'LIABILITY');
