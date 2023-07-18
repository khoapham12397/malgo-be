import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import {
  getCategoriesAndTagsCtl,
  getCodeforcesTagsCtl,
  getCodingProblemsCtl,
  getProblemCtl,
  getRelatedProblemCtl
} from '../controllers/cProblemController';

const router: Router = Router();

router.get('/problem/:problemId', getProblemCtl);
router.get('/categories_tags', getCategoriesAndTagsCtl);
router.post('/search', getCodingProblemsCtl);
router.get('/codeforcestags', getCodeforcesTagsCtl);
router.post('/related', getRelatedProblemCtl);
export default router;
