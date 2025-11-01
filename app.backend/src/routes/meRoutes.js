import { Router } from "express";

import {
  handleListRepoLinks,
  handleUpdateRepoLink,
  handleInstallHook,
  handleUninstallHook,
  handleCheckHookStatus,
} from "../controllers/meController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/repos", handleListRepoLinks);
router.put("/repos/:projectId", handleUpdateRepoLink);
router.post("/repos/:projectId/install-hook", handleInstallHook);
router.delete("/repos/:projectId/install-hook", handleUninstallHook);
router.get("/repos/:projectId/hook-status", handleCheckHookStatus);

export default router;
