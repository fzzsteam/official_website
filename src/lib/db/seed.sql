INSERT INTO membership_plans (
  id,
  code,
  name,
  duration_days,
  price_cents,
  enabled,
  sort_order,
  description,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000030',
    '30d',
    '30天会员',
    30,
    2990,
    1,
    1,
    '30天会员套餐',
    UTC_TIMESTAMP(3),
    UTC_TIMESTAMP(3)
  ),
  (
    '00000000-0000-0000-0000-000000000365',
    '365d',
    '365天会员',
    365,
    19900,
    1,
    2,
    '365天会员套餐',
    UTC_TIMESTAMP(3),
    UTC_TIMESTAMP(3)
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  duration_days = VALUES(duration_days),
  price_cents = VALUES(price_cents),
  enabled = VALUES(enabled),
  sort_order = VALUES(sort_order),
  description = VALUES(description),
  updated_at = UTC_TIMESTAMP(3);
