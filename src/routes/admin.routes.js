import express from "express";
import {
  getAllUsers,
  getUserDetails,
  createUser,
  deleteUser,
} from "../controllers/admin.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.post("/users", createUser);
router.delete("/users/:userId", deleteUser);

export default router;

