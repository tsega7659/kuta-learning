# Task Checklist

## Goal
Simplify quiz creation: add "Create Quiz" button next to "Add Lesson" (in Courses.jsx), open quiz creation modal directly, remove the separate CourseDetail page, and fix the Quizzes tab "Create Quiz" button to open a modal instead of redirecting to Question Bank.

## Steps

- [x] Fix backend Prisma schema (add `description` to Quiz model)
- [x] Regenerate Prisma client (v5.22.0)
- [x] Update App.jsx: remove `/admin/courses/:courseId` route + AdminCourseDetail import
- [x] Update Courses.jsx: add "Create Quiz" button next to "Add Lesson" that opens AdminQuizBuilder modal
- [x] Fix pre-existing bug in Courses.jsx ("Quiz" button references undefined firstLesson/setQuizeModalCtx)
- [ ] Update Quizzes.jsx: "Create Quiz" button opens a topic-selector modal + AdminQuizBuilder instead of navigating to Question Bank
- [ ] Verify no stale imports (delete AdminCourseDetail file reference)

