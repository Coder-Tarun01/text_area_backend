import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobRoutes from "./routes/job.routes.js";
import authRoutes from "./routes/auth.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import userStatsRoutes from "./routes/userStats.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.text({ type: "application/json", limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/user-stats", userStatsRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

