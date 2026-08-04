# TODO — Fix Quiz Submission PrismaClientValidationError

## Problem
The `QuizAttempt` model in `schema.prisma` is missing the `correctAnswers`, `startedAt`, and `submittedAt` fields that the database migrations already added (and which the submit code passes). The `Question` model is also missing the `explanation` field that the migration added.

## Steps
- [x] 1. Update `Backend/prisma/schema.prisma`:
  - [x] Add `correctAnswers Int @default(0)`, `startedAt DateTime? @default(now())`, `submittedAt DateTime? @default(now())` to `QuizAttempt`
  - [x] Add `explanation String?` to `Question`
- [x] 2. Run `npx prisma generate` in `Backend/` to regenerate the Prisma client
- [x] 3. Verify the generated client includes the new fields (regeneration succeeded)
- [ ] 4. Test the quiz submission flow (restart the backend and submit a quiz)
