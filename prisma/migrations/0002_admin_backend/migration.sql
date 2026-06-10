CREATE TABLE IF NOT EXISTS `organizations` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `email` VARCHAR(150) NULL,
  `credit_code` VARCHAR(64) NOT NULL,
  `address` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `business_license_path` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_user_id` CHAR(36) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `reject_reason` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_organizations_credit_code` (`credit_code`),
  KEY `idx_organizations_status` (`status`),
  KEY `idx_organizations_reviewed_by` (`reviewed_by_admin_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` CHAR(36) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `organization_id` CHAR(36) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_users_phone` (`phone`),
  KEY `idx_admin_users_organization_id` (`organization_id`),
  CONSTRAINT `fk_admin_users_organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `organizations`
  ADD CONSTRAINT `fk_organizations_reviewed_by`
  FOREIGN KEY (`reviewed_by_admin_user_id`) REFERENCES `admin_users` (`id`);

ALTER TABLE `dramas` ADD COLUMN `owner_type` VARCHAR(32) NOT NULL DEFAULT 'admin',
  ADD COLUMN `owner_admin_user_id` CHAR(36) NULL,
  ADD COLUMN `organization_id` CHAR(36) NULL,
  ADD COLUMN `review_status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN `submitted_at` DATETIME(3) NULL,
  ADD COLUMN `reviewed_by_admin_user_id` CHAR(36) NULL,
  ADD COLUMN `reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `review_reject_reason` VARCHAR(500) NULL,
  ADD KEY `idx_dramas_owner_admin_user_id` (`owner_admin_user_id`),
  ADD KEY `idx_dramas_organization_id` (`organization_id`),
  ADD KEY `idx_dramas_review_status` (`review_status`),
  ADD CONSTRAINT `fk_dramas_owner_admin_user_id` FOREIGN KEY (`owner_admin_user_id`) REFERENCES `admin_users` (`id`),
  ADD CONSTRAINT `fk_dramas_organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  ADD CONSTRAINT `fk_dramas_reviewed_by_admin_user_id` FOREIGN KEY (`reviewed_by_admin_user_id`) REFERENCES `admin_users` (`id`);
