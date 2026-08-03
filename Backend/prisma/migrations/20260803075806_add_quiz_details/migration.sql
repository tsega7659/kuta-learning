-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'IMAGE';

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "coverImage" TEXT;

-- AlterTable
ALTER TABLE "LessonContent" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "description" TEXT;
