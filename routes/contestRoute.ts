import { Router, Request, Response } from 'express';
import { addExistedProblemToContestCtl, createCodingContestCtl, getContestDetailCtl, getContestInfoCtl, getContestListCtl, getContestRankCtl } from '../controllers/contestController';
import { getContestDetail } from '../services/contestService';

const router = Router();
router.post('/', createCodingContestCtl);
router.put('/updateContest', addExistedProblemToContestCtl);
router.get('/standing/:contestId', getContestRankCtl);
router.get('/',getContestListCtl);
router.get('/:contestId', getContestInfoCtl);
router.get('/:contestId/detail', getContestDetailCtl);

export default router;