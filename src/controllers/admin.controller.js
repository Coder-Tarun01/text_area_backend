import prisma from "../db/index.js";
import bcrypt from "bcryptjs";
import { registerSchema } from "../validators/auth.schema.js";

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        user_type: true,
        job_post_count: true,
        date: true, // registration date
      },
      orderBy: {
        date: "desc",
      },
    });

    return res.json({
      success: true,
      data: users.map((user) => ({
        ...user,
        date: user.date.toISOString().split("T")[0],
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/users/:userId
 * Get specific user details with job postings date-wise
 */
export async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        user_type: true,
        job_post_count: true,
        date: true,
        jobs: {
          select: {
            job_id: true,
            title: true,
            category: true,
            created_at: true,
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    // Group jobs by date
    const jobsByDate = {};
    user.jobs.forEach((job) => {
      const dateKey = new Date(job.created_at).toISOString().split("T")[0];
      if (!jobsByDate[dateKey]) {
        jobsByDate[dateKey] = [];
      }
      jobsByDate[dateKey].push({
        job_id: job.job_id,
        title: job.title,
        category: job.category || "Others",
        created_at: job.created_at,
      });
    });

    const dailyBreakdown = Object.keys(jobsByDate)
      .sort()
      .reverse()
      .map((date) => {
        const jobsForDate = jobsByDate[date];

        const categoryMap = {};
        jobsForDate.forEach((job) => {
          const cat = job.category || "Others";
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });

        const categories = Object.entries(categoryMap).map(([category, count]) => ({
          category,
          count,
        }));

        return {
          date,
          jobs_posted: jobsForDate.length,
          jobs: jobsForDate,
          categories,
        };
      });

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        user_type: user.user_type,
        job_post_count: user.job_post_count,
        registration_date: user.date.toISOString().split("T")[0],
        daily_breakdown: dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function createUser(req, res) {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        message: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      });
    }

    const { username, email, password } = validationResult.data;
    const { user_type } = req.body; // Optional: admin can set user type

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        message: existingUser.email === email ? "Email already registered" : "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        user_type: user_type || "user",
        job_post_count: 0,
        date: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        user_type: true,
        job_post_count: true,
        date: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...user,
        date: user.date.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Delete a user (admin only)
 */
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.user_id) {
      return res.status(400).json({
        error: "Cannot delete yourself",
        message: "You cannot delete your own account",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    // Delete user (jobs will be set to null user_id due to onDelete: SetNull)
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

