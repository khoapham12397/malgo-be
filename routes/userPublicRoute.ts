import { Router } from "express";
import {
  getAllProblems,
  getAllThreads,
  getProblemsBySearchTerm,
  getThreadsBySearchTerm,
  getProblemById,
  getThreadById,
} from "../controllers/userController";
import {
  getRatingsCtl
} from "../controllers/ratingController";

const router: Router = Router();

// Public routes
router.get("/", (req, res) =>
  res.json({ message: "Hello World from User public route" })
);

router.get("/problems", getAllProblems);
router.get("/threads", getAllThreads);
router.post("/problems/search", getProblemsBySearchTerm);
router.post("/threads/search", getThreadsBySearchTerm);
router.get("/problems/:id", getProblemById);
router.get("/threads/:id", getThreadById);
router.get('/ratings',getRatingsCtl);
export default router;
