import express from "express";
import {
  createSubmissionContest,
  createSubmissionDB,
  createSubmissionDBV2,
  getSubmissionList,
  getSubmissionsProblem,
  getSubmissionStatus,
} from "../services/submissionService";
import { SubmissionParam } from "../services/submissionService";

export const createSubmissionCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    /*
        const username = getUsername(req, '');
        if(!username) {
            throw new CustomAPIError('Not permission',403);    
        }
        */
    const submissionId = await createSubmissionDBV2(
      req.body as SubmissionParam
    ); // base64 encode src;
    return res
      .status(201)
      .json({
        successed: true,
        data: { submissionId: submissionId },
      })
      .end();
  } catch (error: any) {
    return res.status(500).json({ successed: false, message: error.message });
  }
};

export const createSubmissionContestCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    /*
        const username = getUsername(req, '');
        if(!username) {
            throw new CustomAPIError('Not permission',403);    
        }
        */
    const submissonId = await createSubmissionContest(
      req.body as SubmissionParam
    ); // base64 encode src;
    return res
      .status(201)
      .json({
        successed: true,
        data: { submissionId: submissonId },
      })
      .end();
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};

export const getSubmissionStatusCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const subIdStr = req.query.submissionId as string;
    const subIds = subIdStr.split(",");
    const statuses: Array<any> = [];

    for (let i = 0; i < subIds.length; i++) {
      const x = await getSubmissionStatus(subIds[i]);

      statuses.push({
        id: subIds[i],
        status: x?.status,
        result: x?.result,
      });
    }

    return res.status(200).json({
      successed: true,
      data: {
        statuses: statuses,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({ successed: false, message: error.message });
  }
};
export const getSubmissionsCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const page = Number(req.params.page);
    const { username, contestId } = req.query;

    const result = await getSubmissionList(
      page,
      username as string | undefined,
      contestId as string | undefined
    );

    return res.status(200).json({
      successed: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ successed: false, message: error.message });
  }
};
export const getSubmissionsProblemCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const page = Number(req.params.page);
    const problemId = req.params.problemId;
    let username = req.query.username;
    const result = await getSubmissionsProblem(
      page,
      problemId,
      username as string | undefined
    );
    return res.status(200).json({
      successed: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ successed: false, message: error.message });
  }
};
