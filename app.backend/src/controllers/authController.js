import bcrypt from "bcryptjs";

import { findUserByEmail } from "../models/userModel.js";
import { generateToken } from "../services/authService.js";

export const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
