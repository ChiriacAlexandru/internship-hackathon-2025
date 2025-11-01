import { Router } from "express";

import {
  handleCreateProject,
  handleListProjects,
} from "../controllers/projectController.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", handleListProjects);
router.post("/", requireRole(["ADMIN"]), handleCreateProject);

export default router;
