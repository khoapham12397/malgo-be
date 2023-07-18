import { Router } from 'express';
import {
  deleteThreadController,
  disableUserController,
  enableUserController,
  getAllUsersController
} from '../controllers/adminController';
import { isAdmin } from '../middleware/authMiddleware';

const router: Router = Router();

router.get('/', (req, res) => res.json({ message: 'Admin private route' }));
router.get('/users', isAdmin, getAllUsersController);
router.put('/user/:username/disable', isAdmin, disableUserController);
router.put('/user/:username/enable', isAdmin, enableUserController);
router.delete('/thread/:threadId', isAdmin, deleteThreadController);

export default router;
