CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  phone VARCHAR(32) NOT NULL,
  nickname VARCHAR(100) NULL,
  avatar_path VARCHAR(255) NULL,
  membership_expires_at DATETIME(3) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sms_codes (
  id CHAR(36) PRIMARY KEY,
  phone VARCHAR(32) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(32) NOT NULL DEFAULT 'login',
  expires_at DATETIME(3) NOT NULL,
  consumed_at DATETIME(3) NULL,
  request_ip VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_sms_codes_phone_purpose (phone, purpose),
  KEY idx_sms_codes_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE membership_plans (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  duration_days INT NOT NULL,
  price_cents INT NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_membership_plans_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  membership_plan_id CHAR(36) NULL,
  total_cents INT NOT NULL,
  paid_cents INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  payment_channel VARCHAR(32) NOT NULL DEFAULT 'wechat_native',
  paid_at DATETIME(3) NULL,
  closed_at DATETIME(3) NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_membership_plan_id (membership_plan_id),
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_membership_plan_id FOREIGN KEY (membership_plan_id) REFERENCES membership_plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wechat_payment_notifications (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  order_no VARCHAR(64) NOT NULL,
  transaction_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_id VARCHAR(128) NOT NULL,
  resource_type VARCHAR(64) NULL,
  raw_payload_json JSON NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_wechat_payment_notifications_event_id (event_id),
  UNIQUE KEY uk_wechat_payment_notifications_transaction_id (transaction_id),
  KEY idx_wechat_payment_notifications_order_id (order_id),
  CONSTRAINT fk_wechat_payment_notifications_order_id FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dramas (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255) NULL,
  synopsis TEXT NULL,
  cover_path VARCHAR(255) NOT NULL,
  poster_path VARCHAR(255) NULL,
  trailer_path VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  release_status VARCHAR(32) NOT NULL DEFAULT 'upcoming',
  published_at DATETIME(3) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_dramas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE drama_genres (
  id CHAR(36) PRIMARY KEY,
  drama_id CHAR(36) NOT NULL,
  genre_code VARCHAR(64) NOT NULL,
  genre_name VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_drama_genres_drama_genre (drama_id, genre_code),
  CONSTRAINT fk_drama_genres_drama_id FOREIGN KEY (drama_id) REFERENCES dramas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE episodes (
  id CHAR(36) PRIMARY KEY,
  drama_id CHAR(36) NOT NULL,
  episode_no INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  summary TEXT NULL,
  video_path VARCHAR(255) NOT NULL,
  cover_path VARCHAR(255) NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  access_level VARCHAR(32) NOT NULL DEFAULT 'member',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_episodes_drama_episode (drama_id, episode_no),
  KEY idx_episodes_drama_id (drama_id),
  CONSTRAINT fk_episodes_drama_id FOREIGN KEY (drama_id) REFERENCES dramas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cast_members (
  id CHAR(36) PRIMARY KEY,
  drama_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role_name VARCHAR(100) NULL,
  avatar_path VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_cast_members_drama_id (drama_id),
  CONSTRAINT fk_cast_members_drama_id FOREIGN KEY (drama_id) REFERENCES dramas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recommendations (
  id CHAR(36) PRIMARY KEY,
  drama_id CHAR(36) NOT NULL,
  recommendation_type VARCHAR(32) NOT NULL DEFAULT 'homepage',
  sort_order INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_recommendations_type_drama (recommendation_type, drama_id),
  CONSTRAINT fk_recommendations_drama_id FOREIGN KEY (drama_id) REFERENCES dramas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
