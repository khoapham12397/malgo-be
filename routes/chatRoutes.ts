import { Router } from 'express';
import { getGroupMsgCtl, getMessageP2PCtl, getPostMessageCtl, insertMessageP2PCtl } from '../controllers/chatController';
const router = Router();

router.get('/post/:postId/message', getPostMessageCtl);
router.get('/group/:groupId/message', getGroupMsgCtl);
router.get('/session/:sessionId/message', getMessageP2PCtl);
router.post('/message', insertMessageP2PCtl);

export default router;