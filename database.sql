-- Database Schema
CREATE DATABASE IF NOT EXISTS app_db;
USE app_db;

-- Users table
CREATE TABLE tbl_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    user_type ENUM('SuperAdmin', 'Admin', 'Agent', 'Sales') NOT NULL,
    root INT DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (root) REFERENCES tbl_users(id) ON DELETE SET NULL
);

-- Plans table
CREATE TABLE tbl_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_plan VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_radius BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User recharges table
CREATE TABLE tbl_user_recharges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    recharged_on DATE NOT NULL,
    recharged_time TIME NOT NULL,
    expiration DATE NOT NULL,
    time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES tbl_users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES tbl_plans(id) ON DELETE CASCADE
);

-- Voucher table
CREATE TABLE tbl_voucher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_plan INT NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('active', 'used', 'expired') DEFAULT 'active',
    generated_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_plan) REFERENCES tbl_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES tbl_users(id) ON DELETE CASCADE
);

-- Seed Data
INSERT INTO tbl_users (username, password_hash, fullname, phone, email, user_type, status) VALUES
('superadmin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Administrator', '1234567890', 'superadmin@example.com', 'SuperAdmin', 'active'),
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', '1234567891', 'admin@example.com', 'Admin', 'active'),
('agent', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Agent User', '1234567892', 'agent@example.com', 'Agent', 'active'),
('sales1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sales User 1', '1234567893', 'sales1@example.com', 'Sales', 'active'),
('sales2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sales User 2', '1234567894', 'sales2@example.com', 'Sales', 'active');

-- Set root relationships for sales users under agent
UPDATE tbl_users SET root = (SELECT id FROM (SELECT id FROM tbl_users WHERE username = 'agent') AS agent) WHERE username IN ('sales1', 'sales2');

-- Insert plans
INSERT INTO tbl_plans (name_plan, price, type, is_radius, enabled) VALUES
('Basic Plan', 10.00, 'basic', FALSE, TRUE),
('Premium Plan', 25.00, 'premium', TRUE, TRUE),
('Enterprise Plan', 50.00, 'enterprise', TRUE, FALSE);

-- Insert sample recharges
INSERT INTO tbl_user_recharges (customer_id, plan_id, status, recharged_on, recharged_time, expiration, time) VALUES
(4, 1, 'active', CURDATE(), '10:00:00', DATE_ADD(CURDATE(), INTERVAL 30 DAY), '10:00:00'),
(5, 2, 'active', CURDATE(), '11:00:00', DATE_ADD(CURDATE(), INTERVAL 30 DAY), '11:00:00'),
(4, 2, 'expired', DATE_SUB(CURDATE(), INTERVAL 60 DAY), '09:00:00', DATE_SUB(CURDATE(), INTERVAL 30 DAY), '09:00:00');

-- Insert sample vouchers
INSERT INTO tbl_voucher (id_plan, code, status, generated_by) VALUES
(1, 'BASIC2024', 'active', 1),
(2, 'PREMIUM2024', 'active', 1),
(3, 'ENTERPRISE2024', 'used', 2);
