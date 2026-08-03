# Fix: Course Detail 500 Error (Prisma client not generated)

## Root Cause
- `Backend/node_modules/.prisma/client` does not exist; `@prisma/client` requires it.
- The schema's `quiz` relation was added, but the Prisma client was never regenerated, so `getCourseById`'s `include: { quiz: ... }` fails with 500.

## Tasks
- [x] 1. Investigate the 500 error and identify root cause
- [ ] 2. Run `npx prisma generate` in Backend to regenerate the client
- [ ] 3. Restart backend and verify `GET /api/courses/:id` returns 200
- [ ] 4. Verify frontend course detail page + Manage button work
