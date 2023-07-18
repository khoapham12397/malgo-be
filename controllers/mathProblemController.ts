import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createMathNote,
  createMathProblem,
  createMathProbSet,
  editMathNote,
  editMathProblem,
  getCategoriesAndTags,
  getMathNote,
  getMathProblems,
  getMathSolutions,
  getProblem,
  getProblemSet,
  getProblemSetList
} from '../services/mathProblemService';
import { getUrlImage, multi_upload_img } from '../utils/uploadfiles';
import multer from 'multer';
import { checkUserValid } from '../utils/checkUser';

export const getProblemCtl = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    const { username } = req.query;

    //console.log("problemId: "+problemId);
    let fixUsername = null;
    if (typeof username == 'string') {
      if (checkUserValid(req, username)) {
        fixUsername = username;
        //console.log(fixUsername);
      }
      
    }

    const mathProblem = await getProblem(problemId, fixUsername);

    if (!mathProblem) {
      return res
        .status(404)
        .json({ successed: false, message: 'Problem not found' });
    }

    return res
      .status(200)
      .json({
        successed: true,
        data: mathProblem
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

export const getMathProblemsCtl = async (req: Request, res: Response) => {
  try {
    const params: GetProblemsParam = req.body;
    console.log('params: ');
    console.log(params);
    const result = await getMathProblems(params);
    console.log(result.itemPerPage);
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
type CreateMathProblemParam = {
  title: string;
  description: string;
  categoryId: number | string;
  tags: Array<string>;
  difficulty: number;
  username: string | undefined;
  hint: string | undefined;
};

export const createMathProblemCtl = async (req: Request, res: Response) => {
  try {
    const params: CreateMathProblemParam = req.body;
    const problem = await createMathProblem(params);
    return res.status(200).json({
      successed: true,
      data: {
        mathProblem: problem
      }
    });
  } catch (error) {
    return res.status(400).json({ successed: false, message: error });
  }
};
export type CreateMathNoteParam = {
  username: string;
  content: string;
  numImg: number;
  problemId: string;
  addToSolution: boolean;
};

export const createMathNoteCtl = async (req: Request, res: Response) => {
  try {
    console.log('vao controller');
    await multi_upload_img(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res
          .status(500)
          .send({
            error: { message: `Multer uploading error: ${err.message}` }
          })
          .end();
        return;
      } else if (err) {
        // An unknown error occurred when uploading.
        if (err.name == 'ExtensionError') {
          res
            .status(413)
            .send({ error: { message: err.message } })
            .end();
        } else {
          res
            .status(500)
            .send({
              error: { message: `unknown uploading error: ${err.message}` }
            })
            .end();
        }
        return;
      }

      // Everything went fine.
      // show file `req.files`
      // show body `req.body`
      const fileList = req.files as Array<any>;
      let imageLink = JSON.stringify(
        fileList.map(item => getUrlImage(item.filename))
      );
      const result = await createMathNote(
        JSON.parse(req.body.data) as CreateMathNoteParam,
        imageLink
      );
      return res.status(200).json({ successed: true, data: result });
    });
  } catch (error) {
    return res.status(400).json({ successed: false, message: error });
  }
};

export type GetMathNoteParam = {
  username: string;
  mathProblemId: string;
};

export const getMathNoteCtl = async (req: Request, res: Response) => {
  try {
    const { username, mathProblemId } = req.query;
    if (typeof username != 'string' || typeof mathProblemId != 'string') {
      return res
        .status(400)
        .json({
          successed: false,
          message: 'username or problem does not existed'
        });
    }
    if (!checkUserValid(req, username as string)) {
      return res
        .status(400)
        .json({ successed: false, message: 'invalid username' });
    }
    const params = {
      username: username,
      mathProblemId: mathProblemId
    } as GetMathNoteParam;

    const mathNote = await getMathNote(params);
    return res
      .status(200)
      .json({
        successed: true,
        data: {
          mathNote: mathNote
        }
      })
      .end();
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};
export type EditMathNoteParam = {
  problemId: string;
  username: string;
  content: string;
  oldImages: Array<string>;
  addToSolution: boolean;
};

export const editMathNoteCtl = async (req: Request, res: Response) => {
  try {
    await multi_upload_img(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res
          .status(500)
          .send({
            error: { message: `Multer uploading error: ${err.message}` }
          })
          .end();
        return;
      } else if (err) {
        // An unknown error occurred when uploading.
        if (err.name == 'ExtensionError') {
          res
            .status(413)
            .send({ error: { message: err.message } })
            .end();
        } else {
          res
            .status(500)
            .send({
              error: { message: `unknown uploading error: ${err.message}` }
            })
            .end();
        }
        return;
      }

      const fileList = req.files as Array<any>;
      let newImgs = fileList.map(item => getUrlImage(item.filename));
      const params = JSON.parse(req.body.data) as EditMathNoteParam;

      let imageLink = JSON.stringify([...params.oldImages, ...newImgs]);

      const result = await editMathNote(params, imageLink);

      return res.status(200).json({ successed: true, data: result });
    });
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};

export const getMathSolutionsCtl = async (req: Request, res: Response) => {
  try {
    const solutions = await getMathSolutions(req.query.problemId as string);
    return res.status(200).json({
      successed: true,
      data: {
        solutions: solutions
      }
    });
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};

export type EditMathProbParam = {
  problemId: string;
  title: string;
  description: string;
  categoryId: number | string;
  tags: Array<string>;
  difficulty: number;
  username: string | undefined;
  hint: string | undefined;
  prevProblems: string | undefined;
  nextProblems: string | undefined;
  probSetList: Array<any>;
};

export const editMathProblemCtl = async (req: Request, res: Response) => {
  try {
    console.log('edit math problem');
    const mathProblem = await editMathProblem(req.body as EditMathProbParam);

    return res.status(200).json({
      successed: true,
      data: {
        mathProblem: mathProblem
      }
    });
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};

export type CreateMathProbSetParam = {
  title: string;
  numProb: number;
  problems: Array<{ problemId: string; order: string }>;
  username: string;
};

export const creareMathProbSetCtl = async (req: Request, res: Response) => {
  try {
    const problemSet = await createMathProbSet(
      req.body as CreateMathProbSetParam
    );
    return res
      .status(200)
      .json({
        successed: true,
        data: {
          problemSet: problemSet
        }
      })
      .end();
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};
export const getProbSetListCtl = async (req: Request, res: Response) => {
  try {
    const setList = await getProblemSetList(1, undefined);
    return res.status(200).json({
      successed: true,
      data: {
        problemSetList: setList
      }
    });
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};

export const getProbSetCtl = async (req: Request, res: Response) => {
  try {
    const { problemSetId } = req.params;

    console.log('id: ' + problemSetId);
    if (!problemSetId)
      return res.status(400).json({ successed: false, message: 'Not found' });
    const problemSet = await getProblemSet(problemSetId);
    return res.status(200).json({
      successed: true,
      data: {
        problemSet: problemSet
      }
    });
    //getProblemSet(req.query.id);
  } catch (error) {
    return res.status(400).json({ successed: false, message: error }).end();
  }
};
