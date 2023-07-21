import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getCategoriesAndTags,
  getCodeForcesTagList,
  getCodingProblems,
  getProblem,
  getRecommendProblemSet,
  getRelatedProblem,
  GetRelatedProblemParam
} from '../services/codingProblemService';

export const getProblemCtl = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    //console.log("problemId: "+problemId);
    const codingProblem = await getProblem(problemId);
    if (!codingProblem) {
      return res
        .status(404)
        .json({ successed: false, message: 'Problem not found' });
    }

    return res
      .status(200)
      .json({
        successed: true,
        data: codingProblem
      })
      .end();
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({
        successed: false,
        message: error
      })
      .end();
  }
};

type GetProblemsParam = {
  category: string | null;
  startDif: number | null;
  endDif: number | null;
  tagList: Array<string>;
  page: number | null;
  q: string | null;
};

export const getCodingProblemsCtl = async (req: Request, res: Response) => {
  try {
    const params: GetProblemsParam = req.body;
    //console.log('params: ');
    //console.log(params);
    const result = await getCodingProblems(params);
    return res.status(200).json({ successed: true, data: result }).end();
  } catch (err) {
    console.log(err);
    return res.sendStatus(400).end();
  }
};

export const getCategoriesAndTagsCtl = async (req: Request, res: Response) => {
  try {
    console.log('vao get categories');
    const result = await getCategoriesAndTags();
    res.status(200).json({ successed: true, data: result }).end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
};

export const getCodeforcesTagsCtl = async (req: Request, res: Response) => {
  try {
    const result = await getCodeForcesTagList();
    res.status(200).json({ successed: true, data: result }).end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
}
export const getRelatedProblemCtl = async (req: Request, res: Response) => {
  try {
    const problems = await getRelatedProblem(req.body as GetRelatedProblemParam);
    return res.status(200).json({
      successed: true, data: {
        problems: problems
      },
    })
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
}

export const getProblemSetByLevelCtl = async (req: Request, res: Response) => {
  try {
      

    //await getRecommendProblemSet()
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
}
