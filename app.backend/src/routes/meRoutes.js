import { Router } from "express";

import { handleListRepoLinks, handleUpdateRepoLink } from "../controllers/meController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/repos", handleListRepoLinks);
router.put("/repos/:projectId", handleUpdateRepoLink);

export default router;
