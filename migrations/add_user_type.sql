-- Migration: Add user_type field to users table
-- Run this SQL directly in your PostgreSQL database

-- Add user_type column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- Update existing users to have 'user' type if they don't have one
UPDATE users 
SET user_type = 'user' 
WHERE user_type IS NULL;

-- Add a check constraint to ensure user_type is either 'user' or 'admin'
ALTER TABLE users 
ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('user', 'admin'));

