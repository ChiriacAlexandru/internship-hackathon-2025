import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "change-me";
const EXPIRY = process.env.JWT_EXPIRES_IN || "8h";

export const generateToken = (payload) =>
  jwt.sign(payload, SECRET, {
    expiresIn: EXPIRY,
  });

export const verifyToken = (token) => jwt.verify(token, SECRET);
