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
    'Azure Cloud Services Annual Contract',
    12000.00,
    '2025-01-01',
    '2025-12-31',
    1000.00,
    'ANNUALLY'
);

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
    'Office 365 Enterprise License',
    24000.00,
    '2025-01-01',
    '2025-12-31',
    2000.00,
    'QUARTERLY'
);

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
    'Azure Premium Support',
    6000.00,
    '2025-01-01',
    '2025-12-31',
    500.00,
    'ONE_TIME'
);

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
    'Visual Studio Enterprise Subscriptions',
    18000.00,
    '2025-01-01',
    '2025-12-31',
    1500.00,
    'BI_ANNUALLY'
);
