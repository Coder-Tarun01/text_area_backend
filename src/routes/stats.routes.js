import express from "express";
import { getDailyStats, getUserStats } from "../controllers/stats.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All stats routes require authentication
router.use(authenticateToken);

router.get("/daily", getDailyStats);
router.get("/user/:userId", getUserStats);

export default router;

