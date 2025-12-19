import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Middleware to verify JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied", message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token", message: error.message });
  }
}

/**
 * Middleware to check if user is admin
 * Must be used after authenticateToken
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  if (req.user.user_type !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin access required",
    });
  }

  next();
}

export { JWT_SECRET };

