import { Router } from "express";

import {
  handleCreateProject,
  handleDeleteProject,
  handleGetProject,
  handleGetProjectRules,
  handleListProjects,
  handleUpdateProject,
} from "../controllers/projectController.js";
import {
  handleListCommitChecks,
  handleGetCommitCheck,
} from "../controllers/commitCheckController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", handleListProjects);
router.post("/", requireRole(["ADMIN"]), handleCreateProject);
router.get("/:projectId", requireRole(["ADMIN"]), handleGetProject);
router.get("/:projectId/rules", handleGetProjectRules);
router.get("/:projectId/commits", handleListCommitChecks);
router.get("/commits/:id", handleGetCommitCheck);
router.put("/:projectId", requireRole(["ADMIN"]), handleUpdateProject);
router.delete("/:projectId", requireRole(["ADMIN"]), handleDeleteProject);

export default router;
