import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
const compression = require("compression");


dotenv.config();

const app = express();
app.use(compression());

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173", "http://localhost:5174","https://kuta-learning.vercel.app"];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json());
app.use(morgan("dev"));

// Simple health‑check
app.get("/", (req, res) => res.send("🚀 Backend is alive"));

// ----- ROUTE IMPORTS -------------------------------------------------
import authRoutes from "./modules/auth/routes.js";
import courseRoutes from "./modules/courses/routes.js";
import progressRoutes from "./modules/progress/routes.js";
import studentRoutes from "./modules/students/routes.js";
import flatLessonRoutes from "./modules/lessons/flatRoutes.js";
import uploadRoutes from "./modules/upload/routes.js";
import quizFlatRoutes from "./modules/quizzes/flatRoutes.js";
import practiceRoutes from "./modules/practice/routes.js";
import { getAttempt } from "./modules/quizzes/controllers.js";
import { authenticateToken } from "./middlewares/authenticateToken.js";

// Serve the uploads folder publicly so the frontend can display the files
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lessons", flatLessonRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/quizzes", quizFlatRoutes);
app.use("/api/practice", practiceRoutes);
app.get("/api/quiz-attempts/:id", authenticateToken, getAttempt);
// ---------------------------------------------------------------------

export default app;
