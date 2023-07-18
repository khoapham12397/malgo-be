import { Router, Request, Response } from 'express';
import { createSubmissionCtl,createSubmissionContestCtl, getSubmissionStatusCtl, getSubmissionsCtl, getSubmissionsProblemCtl } from '../controllers/submissionController';
const router = Router();
router.post('/submit', createSubmissionCtl);
router.post('/contest/submit', createSubmissionContestCtl);
router.get('/status', getSubmissionStatusCtl);
router.get('/:page',getSubmissionsCtl);
router.get('/problem/:problemId/:page', getSubmissionsProblemCtl);

export default router;