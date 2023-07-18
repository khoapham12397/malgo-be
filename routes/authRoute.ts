import { Router } from 'express';
import { checkAuth } from '../controllers/authController';

const router: Router = Router();

router.get('/', (req, res) =>
  res.json({ message: 'Hello World from Auth route' })
);
router.post('/check', checkAuth);

export default router;
