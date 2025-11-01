import { verifyToken } from "../services/authService.js";
import { findUserById } from "../models/userModel.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Authorization header missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    const user = await findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireRole = (roles = []) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden." });
  }

  return next();
};
