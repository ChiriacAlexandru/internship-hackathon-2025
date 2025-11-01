import bcrypt from "bcryptjs";

import {
  createUser,
  findUserByEmail,
  listUsers,
} from "../models/userModel.js";

const ALLOWED_ROLES = new Set(["ADMIN", "DEV", "PO"]);

export const handleCreateUser = async (req, res, next) => {
  try {
    const { email, password, displayName, role } = req.body ?? {};

    if (!email || !password || !role) {
      return res.status(400).json({
        error: "Email, password, and role are required.",
      });
    }

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${Array.from(ALLOWED_ROLES).join(", ")}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long.",
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      email,
      passwordHash,
      displayName,
      role,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleListUsers = async (_req, res, next) => {
  try {
    const users = await listUsers();

    res.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};
