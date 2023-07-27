import dotenv from "dotenv";
import { redisClient } from "./baseService";

dotenv.config();

export type UpdateUserContestParam = {
  username: string;
  maxScore: number;
  penaltyTime: number; // number second from contest begin time
  correct: boolean;
  problemId: string;
  contestId: string;
};
export const getUserContestKey = (username: string, contestId: string) => {
  return `contest:${contestId}:user:${username}`;
};
const calScore = (maxScore: number, penaltyTime: number) => {
  return maxScore - Math.floor(penaltyTime / 60);
};

export const udpateUserContest = async (param: UpdateUserContestParam) => {
  try {
    // store format contest:id:user:id
    /* -> total scores , 
        problem:id -> {score, time, failedCnt} =/
        
        */
    const key = getUserContestKey(param.username, param.contestId);

    const x = await redisClient.HMGET(key, [
      `problem:${param.problemId}`,
      "totalScore",
    ]);
    if (x[1]) {
      const currentScore = Number(x[1]);
      if (x[0]) {
        const problemResult = JSON.parse(x[0]);
        if (problemResult.score > 0) {
          return;
        }
        if (param.correct) {
          const score = param.maxScore - Math.floor(param.penaltyTime / 60);
          problemResult.score = score;
          problemResult.time = param.penaltyTime;
          await redisClient.HSET(key, [
            `problem:${param.problemId}`,
            JSON.stringify(problemResult),
            "totalScore",
            currentScore + score,
          ]);
          await updateContestUserRank(
            param.contestId,
            param.username,
            currentScore + score
          );
        } else {
          problemResult.failedCnt++;
          await redisClient.HSET(
            key,
            `problem:${param.problemId}`,
            JSON.stringify(problemResult)
          );
        }
      } else {
        let result,
          score = 0;
        if (param.correct) {
          score = calScore(param.maxScore, param.penaltyTime);
          result = {
            score: score,
            time: param.penaltyTime,
            failedCnt: 0,
          };
          await redisClient.HSET(key, [
            `problem:${param.problemId}`,
            JSON.stringify(result),
            "totalScore",
            currentScore + score,
          ]);
        } else {
          result = { score: 0, time: 0, failedCnt: 1 };
          await redisClient.HSET(
            key,
            `problem:${param.problemId}`,
            JSON.stringify(result)
          );
        }
        if (score > 0) {
          await updateContestUserRank(
            param.contestId,
            param.username,
            score + currentScore
          );
        }
      }
    } else {
      const score = calScore(param.maxScore, param.penaltyTime);

      let result,
        totalScore = 0;

      if (param.correct) {
        result = { score: score, time: param.penaltyTime, failedCnt: 0 };
        totalScore = score;
      } else {
        result = {
          score: 0,
          time: 0,
          failedCnt: 1,
        };
      }

      await redisClient.HSET(key, [
        "totalScore",
        totalScore,
        `problem:${param.problemId}`,
        JSON.stringify(result),
      ]);
      if (score > 0) {
        await updateContestUserRank(param.contestId, param.username, score);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getContestRankKey = (contestId: string) => {
  return `contest:${contestId}:rank`;
};
export const getContestUserResult = async (
  contestId: string,
  username: string
) => {
  try {
    const key = getUserContestKey(username, contestId);
    //console.log(`get usercontest result: ${key}`)
    const result = await redisClient.HGETALL(key);
    const scores: Array<any> = [];
    const ans: any = {};
    //console.log(result);
    for (const k in result) {
      if (k !== "totalScore") {
        //ans[k] = JSON.parse(result[k]);
        let score: any = JSON.parse(result[k]);
        score.problemId = k.split(":")[1];
        scores.push(score);
      } else ans[k] = Number(result[k]);
    }
    ans.scores = scores;
    ans.username = username;
    return ans;
  } catch (error) {
    console.log(error);
  }
};
export const updateContestUserRank = async (
  contestId: string,
  username: string,
  score: number
) => {
  try {
    const key = getContestRankKey(contestId);
    await redisClient.zAdd(key, { score: score, value: username });
  } catch (error) {
    console.log(error);
  }
};

export const getContestUserRank = async (
  contestId: string,
  start: number,
  end: number
) => {
  try {
    const key = getContestRankKey(contestId);
    const lst = await redisClient.zRangeWithScores(key, start, end, {
      REV: true,
    });
    const results: Array<any> = [];
    //console.log(lst);
    const total = await redisClient.zCard(key);

    for (let i = 0; i < lst.length; i++) {
      results.push(await getContestUserResult(contestId, lst[i].value));
    }
    return {
      standing: results,
      total: total,
    };
  } catch (error) {
    console.log(error);
  }
};
const getLiveContestKey = (contestId: string) => {
  return `contest:${contestId}:live:info`;
};
type ProblemContestSummary = {
  id: string;
  title: string;
  maxScore: number;
};

export type AddLiveContestParam = {
  contestId: string;
  startTime: Date;
  endTime: Date;
  problems: Array<ProblemContestSummary>;
};

const getLiveContestSetKey = () => {
  return "live:contests";
};

export const addLiveContest = async (param: AddLiveContestParam) => {
  try {
    const key = getLiveContestKey(param.contestId);
    // problemList -> starttime, duration
    const result = await redisClient.HSET(key, [
      "startTime",
      param.startTime.toString(),
      "endTime",
      param.endTime.toString(),
      "problems",
      JSON.stringify(param.problems),
    ]);

    await redisClient.SADD(getLiveContestSetKey(), param.contestId);

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const getLiveContestInfoList = async () => {
  try {
    const contestIds = await redisClient.sMembers(getLiveContestSetKey());
    const contests: Array<any> = [];

    for (let i = 0; i < contestIds.length; i++) {
      const contest = await redisClient.HGETALL(
        getLiveContestKey(contestIds[i])
      );
      contests.push({
        startTime: contest.startTime,
        endTime: contest.endTime,
        problems: JSON.parse(contest.problems),
      });
    }
    return contests;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAllContestResult = async (contestId: string) => {
  try {
    const userScores = await redisClient.zRange(
      getContestRankKey(contestId),
      0,
      -1,
      {
        REV: true,
      }
    );

    return userScores;
  } catch (error) {
    throw error;
  }
};
export const getLastUpdateRatingKey = () => {
  return "lastupdate:rating";
};

export const getLastUpdateRating = async () => {
  try {
    const timestamp = await redisClient.GET(getLastUpdateRatingKey());
    return Number(timestamp);
  } catch (error) {
    throw error;
  }
};
export const setLastUpdateRating = async () => {
  return await redisClient.SET(getLastUpdateRatingKey(), Date.now().toString());
};
