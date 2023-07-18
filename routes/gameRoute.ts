import { Router } from "express";
import { addQuizRoundCtl, getQuizRoundCtl } from "../controllers/GameDataController";
const router:Router = Router();

router.get("/quizlist", getQuizRoundCtl);
router.post("/quiz", addQuizRoundCtl);

//router.post("/enterquiz",);

export default router;