-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "job_post_count" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
