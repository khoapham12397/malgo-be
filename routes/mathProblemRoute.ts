import { Router } from 'express';
import {
  creareMathProbSetCtl,
  createMathNoteCtl,
  createMathProblemCtl,
  editMathNoteCtl,
  editMathProblemCtl,
  getCategoriesAndTagsCtl,
  getMathNoteCtl,
  getMathProblemsCtl,
  getMathSolutionsCtl,
  getProblemCtl,
  getProbSetCtl,
  getProbSetListCtl
} from '../controllers/mathProblemController';
import { isAuthenticated, isAuthenticatedOption } from '../middleware/authMiddleware';

const router: Router = Router();
router.get('/problem/:problemId', isAuthenticatedOption, getProblemCtl);

router.get('/categories_tags', getCategoriesAndTagsCtl);
router.post('/search', getMathProblemsCtl);
router.get('/solutions', getMathSolutionsCtl);

router.post('/create',isAuthenticated, createMathProblemCtl);
router.put('/problem', isAuthenticated,editMathProblemCtl);

router.post('/note',isAuthenticated, createMathNoteCtl);
router.get('/note',isAuthenticated,getMathNoteCtl);
router.put('/note', isAuthenticated,editMathNoteCtl);

router.post('/set', isAuthenticated,creareMathProbSetCtl);
router.get('/set', isAuthenticatedOption,getProbSetListCtl);
router.get('/set/:problemSetId', isAuthenticated,getProbSetCtl);
export default router;

