import express from "express";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import {
    getPracticeTopics,
    startPracticeModule,
    getPracticeAttempt,
    submitPracticeAttempt,
    getRandomQuestion,
    verifyRandomQuestion
} from "./controllers.js";

const router = express.Router();

// All practice routes are for students (authenticated)
router.use(authenticateToken);

router.get("/random-question", getRandomQuestion);
router.post("/random-question/verify", verifyRandomQuestion);

router.get("/topics", getPracticeTopics);
router.post("/topics/:topicId/start", startPracticeModule);
router.get("/attempts/:attemptId", getPracticeAttempt);
router.post("/attempts/:attemptId/submit", submitPracticeAttempt);

export default router;
