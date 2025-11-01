import { Router } from "express";
import {
  handleCreateReview,
  handleQuickCheck,
  handleChatWithAI,
} from "../controllers/reviewController.js";

const router = Router();

router.post("/", handleCreateReview);
router.post("/quick", handleQuickCheck);
router.post("/chat", handleChatWithAI);

export default router;
