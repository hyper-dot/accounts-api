-- Insert vendor
INSERT INTO vendor (name) VALUES ('Microsoft');

-- Insert purchase order
INSERT INTO purchase_order (
    vendor_id,
    description,
    total_amount,
    start_date,
    end_date,
    amount_per_month,
    frequency
) VALUES (
    (SELECT id FROM vendor WHERE name = 'Microsoft'),
    'PO-1',
    55000,
    '2025-01-01',
    '2025-10-31',
    4583,
    'MONTHLY'
);