import { Router } from "express";
import {
  getChatSessionP2PCtl,
  getChatSessionP2PListCtl,
  getContactListCtl,
  getGroupMsgCtl,
  getMessageP2PCtl,
  getPostMessageCtl,
  insertMessageP2PCtl,
} from "../controllers/chatController";
import {
  acceptFriendReqCtl,
  addUserToGroupCtl,
  checkFriendShipCtl,
  createGroupCtl,
  createPostGroupCtl,
  findUserByEmailCtl,
  getFriendListCtl,
  getFriendReqFromCtl,
  getFriendReqToCtl,
  getGroupListCtl,
  getGroupMemberCtl,
  getGroupPostListCtl,
  getRelationShipTwoUserCtl,
  getShareResourceCtl,
  lookedShareCtl,
  postFriendReqCtl,
  setSeenMsgSessionP2PCtl,
  shareResourceCtl,
} from "../controllers/userController2";

const router: Router = Router();
/* All private routes */

router.get("/friends/:username", getFriendListCtl);
router.get("/friendreq/to/:username", getFriendReqToCtl);
router.get("/friendreq/from/:username", getFriendReqFromCtl);
router.post("/friendreq", postFriendReqCtl);
router.post("/acceptfriend", acceptFriendReqCtl);
router.get("/checkfriend", checkFriendShipCtl);
router.get("/relationship", getRelationShipTwoUserCtl);

router.post("/share", shareResourceCtl);
router.get("/share/:username", getShareResourceCtl);
router.post("/share/:shareId/looked", lookedShareCtl);

router.post("/group", createGroupCtl);
router.post("/group/user", addUserToGroupCtl);
router.post("/group/thread", createPostGroupCtl);
router.get("/group/member", getGroupMemberCtl);
router.get("/group/:username", getGroupListCtl);
router.get("/group/:groupId/post", getGroupPostListCtl);
// group post
router.get("/post/:postId/message", getPostMessageCtl);
router.get("/group/:groupId/message", getGroupMsgCtl);

router.get("/session/p2p", getChatSessionP2PListCtl);
router.get("/session/p2p/:sessionId/message", getMessageP2PCtl);

router.get("/session/:sessionId/seen", setSeenMsgSessionP2PCtl);
router.get("/session/:sessionId", getChatSessionP2PCtl);
router.get("/searchbyemail", findUserByEmailCtl);
router.post("/message", insertMessageP2PCtl);

router.get("/contacts", getContactListCtl);

export default router;
