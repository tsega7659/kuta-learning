import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS – allow the Vite dev server (default 5173) to call the API
app.use(
    cors({
        origin: "http://localhost:5174",
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

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/students", studentRoutes);
// ---------------------------------------------------------------------

export default app;
