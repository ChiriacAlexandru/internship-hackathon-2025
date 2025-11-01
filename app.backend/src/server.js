import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ensureDatabase } from "./db/migrate.js";
import authRouter from "./routes/authRoutes.js";
import meRouter from "./routes/meRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import userRouter from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/projects", projectRouter);
app.use("/review", reviewRouter);
app.use("/users", userRouter);

// Basic error handler so frontend gets useful feedback
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    if (process.env.BYPASS_DB === "true") {
      console.warn("Database checks are bypassed. Set BYPASS_DB=false for production.");
    } else {
      await ensureDatabase();
      console.log("Database verified and migrations executed.");
    }

    app.listen(PORT, () => {
      console.log(`AI Review backend listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
