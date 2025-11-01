import { Router } from "express";
import {
  handleCreateReview,
  handleQuickCheck,
} from "../controllers/reviewController.js";

const router = Router();

router.post("/", handleCreateReview);
router.post("/quick", handleQuickCheck);

export default router;
