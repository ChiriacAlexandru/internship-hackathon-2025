import { Router } from 'express';
import { handleCreateReview } from '../controllers/reviewController.js';

const router = Router();

router.post('/', handleCreateReview);

export default router;
