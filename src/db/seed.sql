INSERT INTO vendor (name) VALUES ('Microsoft');
INSERT INTO purchase_order (
    vendor_id,
    description,
    total_amount,
    start_date,
    end_date,
    amount_per_month,
    frequency
) VALUES (
    1, -- references the Microsoft vendor we just created
    'Azure Cloud Services Annual Contract',
    12000.00,
    '2025-01-01',
    '2025-12-31',
    1000.00,
    'ANNUALLY'
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
    1, -- Microsoft Office 365 subscription
    'Office 365 Enterprise License',
    24000.00,
    '2025-01-01',
    '2025-12-31',
    2000.00,
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
    1, -- Microsoft Azure Support Contract
    'Azure Premium Support',
    6000.00,
    '2025-01-01',
    '2025-12-31',
    500.00,
    'ONE_TIME'
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
    1, -- Microsoft Azure Development Tools
    'Visual Studio Enterprise Subscriptions',
    18000.00,
    '2025-01-01',
    '2025-12-31',
    1500.00,
    'BI_ANNUALLY'
);
