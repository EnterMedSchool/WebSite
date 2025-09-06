ALTER TABLE "universities"
  ADD COLUMN IF NOT EXISTS "language" varchar(24),
  ADD COLUMN IF NOT EXISTS "admission_exam" varchar(40);

