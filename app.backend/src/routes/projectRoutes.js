import { Router } from "express";

import {
  handleCreateProject,
  handleDeleteProject,
  handleGetProject,
  handleListProjects,
  handleUpdateProject,
} from "../controllers/projectController.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", handleListProjects);
router.post("/", requireRole(["ADMIN"]), handleCreateProject);
router.get("/:projectId", requireRole(["ADMIN"]), handleGetProject);
router.put("/:projectId", requireRole(["ADMIN"]), handleUpdateProject);
router.delete("/:projectId", requireRole(["ADMIN"]), handleDeleteProject);

export default router;
