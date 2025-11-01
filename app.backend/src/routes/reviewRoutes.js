import { Router } from "express";
import {
  handleCreateReview,
  handleQuickCheck,
  handleChatWithAI,
} from "../controllers/reviewController.js";
import { handlePreCommitCheck } from "../controllers/commitCheckController.js";

const router = Router();

router.post("/", handleCreateReview);
router.post("/quick", handleQuickCheck);
router.post("/chat", handleChatWithAI);
router.post("/pre-commit", handlePreCommitCheck);

export default router;
