import express from "express";
import { createJob, checkDuplicate } from "../controllers/job.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Job routes require authentication
router.use(authenticateToken);
router.post("/check-duplicate", checkDuplicate);
router.post("/", createJob);

export default router;

