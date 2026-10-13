DROP DATABASE IF EXISTS fileflix;
CREATE DATABASE fileflix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fileflix;

-- =====================================================================
-- 1. STORAGE PLANS  (quota per plan)
-- =====================================================================
CREATE TABLE plans (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(50)  NOT NULL UNIQUE,
  storage_quota_bytes BIGINT      NOT NULL,              -- total space allowed
  max_file_size_bytes BIGINT      NOT NULL,              -- single file limit
  created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO plans (name, storage_quota_bytes, max_file_size_bytes) VALUES
  ('FREE', 5   * 1024 * 1024 * 1024,  500 * 1024 * 1024),   -- 5 GB total, 500 MB per file
  ('PRO',  100 * 1024 * 1024 * 1024, 2048 * 1024 * 1024);   -- 100 GB total, 2 GB per file

-- =====================================================================
-- 2. USERS
-- =====================================================================
CREATE TABLE users (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  email               VARCHAR(190) NOT NULL UNIQUE,
  password_hash       VARCHAR(100) NOT NULL,              -- BCrypt hash
  email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  plan_id             INT          NOT NULL DEFAULT 1,
  storage_used_bytes  BIGINT       NOT NULL DEFAULT 0,    -- kept in sync by triggers
  status              ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at       TIMESTAMP    NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. OTP TOKENS  (signup verification + forgot password)
-- =====================================================================
CREATE TABLE otp_tokens (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL,
  otp_hash      VARCHAR(100) NOT NULL,                    -- store HASHED, never plain
  purpose       ENUM('SIGNUP','RESET') NOT NULL,
  attempts      INT          NOT NULL DEFAULT 0,          -- max 5 wrong attempts
  used          BOOLEAN      NOT NULL DEFAULT FALSE,
  expires_at    TIMESTAMP    NOT NULL,                    -- created_at + 10 minutes
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email_purpose (email, purpose),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB;

-- Short-lived token issued after the reset OTP is verified
CREATE TABLE password_reset_tokens (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  token_hash  VARCHAR(100) NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMP    NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_prt_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. REFRESH TOKENS  (optional, for long sessions)
-- =====================================================================
CREATE TABLE refresh_tokens (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  token_hash  VARCHAR(100) NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMP    NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. FOLDERS  (Main folder = files.folder_id IS NULL)
-- =====================================================================
CREATE TABLE folders (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_folders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_folder (user_id, name)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. FILES  (metadata; actual bytes live on disk: uploads/{userId}/{folder}/{stored_name})
-- =====================================================================
CREATE TABLE files (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT        NOT NULL,
  folder_id        BIGINT        NULL,                    -- NULL = Main folder
  original_name    VARCHAR(255)  NOT NULL,                -- name shown to the user
  stored_name      VARCHAR(255)  NOT NULL,                -- name on disk (unique, safe)
  storage_path     VARCHAR(500)  NOT NULL,                -- relative path on disk / S3 key later
  extension        VARCHAR(20)   NULL,
  content_type     VARCHAR(150)  NULL,
  size_bytes       BIGINT        NOT NULL,
  checksum_sha256  CHAR(64)      NULL,
  is_starred       BOOLEAN       NOT NULL DEFAULT FALSE,
  is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,  -- TRUE = in Trash (still counts toward storage)
  deleted_at       TIMESTAMP     NULL,
  last_accessed_at TIMESTAMP     NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_files_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_files_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  UNIQUE KEY uq_user_path (user_id, storage_path),
  INDEX idx_files_user (user_id),
  INDEX idx_files_user_folder (user_id, folder_id),
  INDEX idx_files_name (user_id, original_name),
  INDEX idx_files_deleted (user_id, is_deleted)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. ACTIVITY LOGS  (history of everything)
-- =====================================================================
CREATE TABLE activity_logs (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT       NULL,                         -- NULL for failed logins of unknown emails
  action       ENUM('SIGNUP','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_RESET',
                    'UPLOAD','DELETE','RESTORE','MOVE','RENAME','PREVIEW','DOWNLOAD',
                    'FOLDER_CREATE','FOLDER_DELETE','SHARE_CREATE','SHARE_REVOKE') NOT NULL,
  target_type  ENUM('FILE','FOLDER','AUTH','SHARE') NOT NULL,
  target_name  VARCHAR(255) NULL,
  folder       VARCHAR(100) NULL,
  details      VARCHAR(500) NULL,
  ip_address   VARCHAR(45)  NULL,
  user_agent   VARCHAR(255) NULL,
  status       ENUM('SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_logs_user_time (user_id, created_at),
  INDEX idx_logs_action (user_id, action)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. SHARE LINKS  (future: token-based, expiring, revocable)
-- =====================================================================
CREATE TABLE share_links (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  file_id         BIGINT       NOT NULL,
  owner_id        BIGINT       NOT NULL,
  token           CHAR(64)     NOT NULL UNIQUE,           -- unguessable random token
  can_download    BOOLEAN      NOT NULL DEFAULT FALSE,    -- FALSE = view only
  expires_at      TIMESTAMP    NULL,                      -- NULL = never expires
  revoked         BOOLEAN      NOT NULL DEFAULT FALSE,
  view_count      INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_share_file  FOREIGN KEY (file_id)  REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_share_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_share_owner (owner_id)
) ENGINE=InnoDB;

-- Direct sharing with a registered user ("Shared with me" / "Shared by me")
CREATE TABLE file_shares (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  file_id       BIGINT   NOT NULL,
  owner_id      BIGINT   NOT NULL,
  shared_with   BIGINT   NOT NULL,
  can_download  BOOLEAN  NOT NULL DEFAULT FALSE,
  expires_at    TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fs_file  FOREIGN KEY (file_id)     REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_fs_owner FOREIGN KEY (owner_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fs_with  FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_file_user (file_id, shared_with)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. TRIGGERS  (keep users.storage_used_bytes accurate automatically)
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_files_after_insert
AFTER INSERT ON files FOR EACH ROW
BEGIN
  UPDATE users SET storage_used_bytes = storage_used_bytes + NEW.size_bytes
  WHERE id = NEW.user_id;
END$$

CREATE TRIGGER trg_files_after_update
AFTER UPDATE ON files FOR EACH ROW
BEGIN
  IF NEW.size_bytes <> OLD.size_bytes THEN
    UPDATE users
    SET storage_used_bytes = storage_used_bytes - OLD.size_bytes + NEW.size_bytes
    WHERE id = NEW.user_id;
  END IF;
END$$

CREATE TRIGGER trg_files_after_delete
AFTER DELETE ON files FOR EACH ROW
BEGIN
  UPDATE users SET storage_used_bytes = GREATEST(storage_used_bytes - OLD.size_bytes, 0)
  WHERE id = OLD.user_id;
END$$

-- Block uploads that exceed the quota or the per-file limit
CREATE TRIGGER trg_files_before_insert
BEFORE INSERT ON files FOR EACH ROW
BEGIN
  DECLARE v_quota BIGINT;
  DECLARE v_max   BIGINT;
  DECLARE v_used  BIGINT;

  SELECT p.storage_quota_bytes, p.max_file_size_bytes, u.storage_used_bytes
    INTO v_quota, v_max, v_used
  FROM users u JOIN plans p ON p.id = u.plan_id
  WHERE u.id = NEW.user_id;

  IF NEW.size_bytes > v_max THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'File exceeds the maximum allowed file size.';
  END IF;
  IF v_used + NEW.size_bytes > v_quota THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Storage quota exceeded.';
  END IF;
END$$

-- =====================================================================
-- 10. STORED PROCEDURES
-- =====================================================================

CREATE PROCEDURE sp_recalculate_storage(IN p_user_id BIGINT)
BEGIN
  UPDATE users u
  SET u.storage_used_bytes = (SELECT COALESCE(SUM(size_bytes), 0)
                              FROM files WHERE user_id = p_user_id)
  WHERE u.id = p_user_id;
END$$

CREATE PROCEDURE sp_storage_usage(IN p_user_id BIGINT)
BEGIN
  SELECT
    u.id                                                        AS user_id,
    p.name                                                      AS plan,
    u.storage_used_bytes                                        AS used_bytes,
    p.storage_quota_bytes                                       AS quota_bytes,
    p.storage_quota_bytes - u.storage_used_bytes                AS free_bytes,
    ROUND(u.storage_used_bytes * 100 / p.storage_quota_bytes, 2) AS used_percent,
    (SELECT COUNT(*) FROM files WHERE user_id = u.id AND is_deleted = FALSE) AS total_files
  FROM users u JOIN plans p ON p.id = u.plan_id
  WHERE u.id = p_user_id;
END$$

CREATE PROCEDURE sp_purge_trash(IN p_days INT)
BEGIN
  DELETE FROM files
  WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL p_days DAY;
END$$

DELIMITER ;

-- =====================================================================
-- 11. VIEWS  (ready-made queries for the dashboard)
-- =====================================================================

CREATE VIEW v_user_storage AS
SELECT u.id AS user_id, u.name, u.email, p.name AS plan,
       u.storage_used_bytes AS used_bytes,
       p.storage_quota_bytes AS quota_bytes,
       ROUND(u.storage_used_bytes * 100 / p.storage_quota_bytes, 2) AS used_percent
FROM users u JOIN plans p ON p.id = u.plan_id;

CREATE VIEW v_folder_summary AS
SELECT u.id AS user_id, 'Main Folder' AS folder_name,
       COUNT(f.id) AS total_elements,
       COALESCE(SUM(f.size_bytes), 0) AS total_size_bytes,
       MAX(f.updated_at) AS last_modified
FROM users u
LEFT JOIN files f ON f.user_id = u.id AND f.folder_id IS NULL AND f.is_deleted = FALSE
GROUP BY u.id
UNION ALL
SELECT fo.user_id, fo.name,
       COUNT(f.id),
       COALESCE(SUM(f.size_bytes), 0),
       MAX(f.updated_at)
FROM folders fo
LEFT JOIN files f ON f.folder_id = fo.id AND f.is_deleted = FALSE
GROUP BY fo.id, fo.user_id, fo.name;

CREATE VIEW v_storage_by_type AS
SELECT user_id,
       CASE
         WHEN content_type LIKE 'image/%'      THEN 'Images'
         WHEN content_type LIKE 'video/%'      THEN 'Videos'
         WHEN content_type LIKE 'audio/%'      THEN 'Audio'
         WHEN content_type = 'application/pdf' THEN 'PDFs'
         WHEN content_type LIKE 'text/%'       THEN 'Text'
         ELSE 'Others'
       END AS file_type,
       COUNT(*)        AS total_files,
       SUM(size_bytes) AS total_bytes
FROM files
WHERE is_deleted = FALSE
GROUP BY user_id, file_type;

CREATE VIEW v_recent_activity AS
SELECT id, user_id, action, target_type, target_name, folder, status, created_at
FROM activity_logs
ORDER BY created_at DESC;
