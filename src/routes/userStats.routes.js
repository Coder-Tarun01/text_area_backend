import express from "express";
import { getUserDailyStats } from "../controllers/userStats.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All user stats routes require authentication
router.use(authenticateToken);

// Users can only see their own stats
router.get("/", getUserDailyStats);
router.get("/me", getUserDailyStats);

export default router;

