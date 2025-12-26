import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobRoutes from "./routes/job.routes.js";
import authRoutes from "./routes/auth.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import userStatsRoutes from "./routes/userStats.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import prisma from "./db/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection check function
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
    console.log(`📊 Database: ${process.env.DB_NAME || "N/A"} at ${process.env.DB_HOST || "N/A"}:${process.env.DB_PORT || "N/A"}`);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error(`Error: ${error.message}`);
    console.error(`Database URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@") : "Not configured"}`);
    return false;
  }
}

// Middleware
// CORS configuration - allow ngrok frontend URL and localhost for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://beatrice-unchalked-hypernormally.ngrok-free.dev',
      // Add your ngrok frontend URL here when you have it
      process.env.FRONTEND_URL,
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
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

// Start server and check database connection
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("🔍 Checking database connection...");
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.warn("⚠️  Server started but database is not connected. Some features may not work.");
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  console.log("✅ Database disconnected");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  console.log("✅ Database disconnected");
  process.exit(0);
});

