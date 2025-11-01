import { Router } from "express";

import {
  handleCreateUser,
  handleListUsers,
} from "../controllers/userController.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["ADMIN"]));

router.get("/", handleListUsers);
router.post("/", handleCreateUser);

export default router;
