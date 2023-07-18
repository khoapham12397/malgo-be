import { Router } from 'express';
import { getUserProfile } from '../controllers/userController';

const router: Router = Router();

// Private routes
router.get('/', (req, res) =>
  res.json({ message: 'Hello World from User private route' })
);
router.get('/profile/:username', getUserProfile);

export default router;
