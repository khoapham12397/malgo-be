import express from "express";
import {
  getContestUserRank,
  getLiveContestInfoList,
} from "../redis/contestService";
import {
  addExistedProblemToContest,
  createCodingContest,
  CreateCodingContestParam,
  getContestDetail,
  getContestInfo,
  getContestList,
} from "../services/contestService";

export const createCodingContestCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const param = req.body as CreateCodingContestParam;
    const contest = await createCodingContest(param);

    return res.status(201).json({
      susccessed: true,
      data: {
        contest: contest,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};
export const addExistedProblemToContestCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { problemId, contestId,totalPoint } = req.body;

    await addExistedProblemToContest(problemId, contestId,totalPoint);
    return res.status(200).json({
      successed: true,
    });
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};
export const getContestRankCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const contestId = req.params.contestId;
    const { start, end } = req.query;
    const result = await getContestUserRank(
      contestId,
      Number(start),
      Number(end)
    );

    return res.status(200).json({
      successed: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};
export const getContestListCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { type, page } = req.query;

    if (type === "upcomming" || type === "past") {
      const result = await getContestList(
        type,
        page ? Number(page) : undefined
      );
      return res.status(200).json({
        successed: true,
        data: result,
      });
    } else {
      const upcomming = await getContestList(
        "upcomming",
        page ? Number(page) : undefined
      );
      const past = await getContestList(
        "pass",
        page ? Number(page) : undefined
      );
      const live = await getContestList(
        "live",
        page ? Number(page) : undefined
      );

      return res.status(200).json({
        successed: true,
        data: {
          upcomming: upcomming,
          past: past,
          live: live,
        },
      });
    }
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};

export const getContestInfoCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { contestId } = req.params;
    const contest = await getContestInfo(contestId);
    return res.status(200).json({
      successed: true,
      data: {
        contest: contest,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};

export const getLiveContestListCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const result = await getLiveContestInfoList();
    return res.status(200).json({
      successed: true,
      data: {
        contests: result,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};

export const addToLiveContest = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    //await addLiveContest();
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};

export const getContestDetailCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const contest = await getContestDetail(req.params.contestId);
    return res.status(200).json({
      successed: true,
      data: {
        contest: contest,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      successed: false,
      message: error.message,
    });
  }
};
