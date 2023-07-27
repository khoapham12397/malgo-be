import { Router } from "express";
import {
  addCommentCtl,
  createThreadCtl,
  editThreadCtl,
  getCategoriesAndTagsCtl,
  getChildCommentsCtl,
  getRootCommentsCtl,
  getThreadCtl,
  getThreadListCtl,
  likeCommentCtl,
  likeThreadCtl,
  searchSimilarThreadCtl,
} from "../controllers/threadController";

import { isAuthenticatedOption } from "../middleware/authMiddleware";

const router: Router = Router();

router.get("/thread/:threadId", getThreadCtl);
router.get("/rootComments", getRootCommentsCtl);
router.get("/childComments", getChildCommentsCtl);
router.post("/comment", addCommentCtl); // need authentiate
router.post("/thread", createThreadCtl); // need authenticate
router.get("/threads", isAuthenticatedOption, getThreadListCtl);
router.post("/likeThread", likeThreadCtl); // needd authenticate
router.post("/likeComment", likeCommentCtl); // need authenticate
router.get("/thread_categories_tags", getCategoriesAndTagsCtl);
router.post("/editThread", editThreadCtl); // nedd authenticate

router.post("/search", searchSimilarThreadCtl);

export default router;
