-- Production Database Setup Script
-- Run this script in pgAdmin to create all tables

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_type" TEXT NOT NULL DEFAULT 'user',
    "job_post_count" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_user_type" CHECK ("user_type" IN ('user', 'admin'))
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS "jobs" (
    "job_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "department" TEXT,
    "category" TEXT,
    "job_type" TEXT,
    "location" TEXT,
    "eligibility" TEXT,
    "qualification" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "preferred_qualifications" TEXT,
    "requirements" TEXT,
    "skills" TEXT,
    "salary" TEXT,
    "applicants" TEXT,
    "responsibilities" TEXT,
    "description" TEXT,
    "apply_link" TEXT,
    "notification_pdf" TEXT,
    "posted_date" DATE,
    "last_date" DATE,
    "source" TEXT,
    "source_url" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'jobs_user_id_fkey'
    ) THEN
        ALTER TABLE "jobs" 
        ADD CONSTRAINT "jobs_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Add user_type column if users table exists but column doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
            ALTER TABLE "users" ADD COLUMN "user_type" TEXT NOT NULL DEFAULT 'user';
            ALTER TABLE "users" ADD CONSTRAINT "check_user_type" CHECK ("user_type" IN ('user', 'admin'));
        END IF;
    END IF;
END $$;

-- Verify tables were created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'jobs')
ORDER BY table_name, ordinal_position;

