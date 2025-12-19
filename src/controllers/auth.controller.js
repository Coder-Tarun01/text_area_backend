import prisma from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { JWT_SECRET } from "../middleware/auth.js";

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(req, res) {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        message: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      });
    }

    const { username, email, password, user_type } = validationResult.data;

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

    // Create user with authentication details
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        user_type: user_type || "user", // Use provided user_type or default to "user"
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

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email, username: user.username, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * POST /api/auth/login
 * Login user
 */
export async function login(req, res) {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        message: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      });
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email, username: user.username, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        job_post_count: user.job_post_count,
        date: user.date,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

