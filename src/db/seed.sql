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
    120000,
    '2025-01-01',
    '2025-10-31',
    12000,
    'MONTHLY'
);

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
    'PO-2',
    10000,
    '2025-01-01',
    '2025-12-31',
    833,
    'QUARTERLY'
);

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
    'PO-3',
    10000,
    '2025-01-01',
    '2025-12-31',
    833,
    'MONTHLY'
);
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
    'PO-3',
    10000,
    '2025-01-01',
    '2025-12-31',
    833,
    'BI_ANNUALLY'
);

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
    'PO-3',
    10000,
    '2025-01-01',
    '2025-12-31',
    833,
    'ANNUALLY'
);