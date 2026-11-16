ALTER TYPE "ExamAttemptStatus" ADD VALUE 'PAUSED';

ALTER TABLE "NationalExamAttempt"
ADD COLUMN "lastResumedAt" TIMESTAMP(3);

UPDATE "NationalExamAttempt"
SET "lastResumedAt" = "updatedAt"
WHERE "status" = 'IN_PROGRESS';
