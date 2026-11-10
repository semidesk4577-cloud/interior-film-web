CREATE TABLE IF NOT EXISTS intakes (
 id CHAR(36) PRIMARY KEY,
 kind ENUM('question','consultation') NOT NULL,
 author VARCHAR(40) NOT NULL,
 title VARCHAR(120) NULL,
 body TEXT NOT NULL,
 phone VARCHAR(40) NULL,
 status ENUM('new','in_progress','closed') NOT NULL DEFAULT 'new',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_kind_created (kind,created_at),
 INDEX idx_status_created (status,created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
