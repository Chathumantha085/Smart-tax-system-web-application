CREATE DATABASE IF NOT EXISTS smart_tax;

USE smart_tax;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'taxpayer', 'accountant') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax profiles
CREATE TABLE IF NOT EXISTS tax_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tax_id VARCHAR(50) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  address TEXT,
  filing_status ENUM('single', 'married', 'head_of_household') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Income records
CREATE TABLE IF NOT EXISTS incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  source VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  year YEAR NOT NULL,
  is_taxable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES tax_profiles(id)
);

-- Deductions
CREATE TABLE IF NOT EXISTS deductions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  year YEAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES tax_profiles(id)
);

-- Tax returns
CREATE TABLE IF NOT EXISTS tax_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  year YEAR NOT NULL,
  total_income DECIMAL(12, 2) NOT NULL,
  total_deductions DECIMAL(12, 2) NOT NULL,
  taxable_income DECIMAL(12, 2) NOT NULL,
  tax_owed DECIMAL(12, 2) NOT NULL,
  tax_paid DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'filed', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES tax_profiles(id),
  UNIQUE KEY (profile_id, year)
);


-- Add admin approval status to users table
ALTER TABLE users 
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_notes TEXT;

-- Create tax categories table
CREATE TABLE IF NOT EXISTS tax_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  tax_percentage DECIMAL(5, 2) NOT NULL,
  max_deduction DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Update deductions table to link with categories
ALTER TABLE deductions
ADD COLUMN category_id INT,
ADD FOREIGN KEY (category_id) REFERENCES tax_categories(id);



-- Add expense-related tables
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  receipt_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES tax_categories(id)
);