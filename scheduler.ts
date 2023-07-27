import cron, { ScheduleOptions } from "node-cron";
import { clearInterval } from "timers";
import {
  getBatchSubmission,
  getBatchSubmissionContest,
  sendSubmissionBatch,
  sendSubmissionBatchList,
  sendSubmissionBatchListV2,
} from "./judgeApi";
import {
  getPendingSubmission,
  getPendingSubmissionList,
  getPendingSubmissionListV2,
  getPendingTokenContest,
  getPendingTokenContestList,
  taskGetPendingTokens,
} from "./redis/submissionService";
import {
  calRatingAfterContest,
  checkContestListAndCalRating,
} from "./services/ratingService";

const scheduleTokenOptions: ScheduleOptions = {
  scheduled: false,
  name: "get-token",
  recoverMissedExecutions: false,
};
const scheduleTokenContestOptions: ScheduleOptions = {
  scheduled: false,
  name: "get-token-contest",
  recoverMissedExecutions: false,
};

const scheduleCalRatingOptions: ScheduleOptions = {
  scheduled: true,
  name: "cal-rating",
  recoverMissedExecutions: false,
};

let scheduleOff = true;
let processed = 0;
let tokenProcessRunning = false;
let submissionProcessRunning = false;
let tokenQueueEmptyCnt = 0;
let subQueueEmptyCnt = 0;
let submitToken: any;

const scheduleToken = async () => {
  //console.log(`start job at : ${Date.now()}`);
  try {
    tokenProcessRunning = true;
    const tokens = await taskGetPendingTokens(20);
    if (tokens.length > 0) {
      tokenQueueEmptyCnt = 0;
      await getBatchSubmission(tokens);
    } else {
      tokenQueueEmptyCnt++;
      if (tokenQueueEmptyCnt === 50) {
        console.log("STOP token process");
        tokenProcessRunning = false;
        //await submitTokenScheduler.stop();
        if (submitToken) clearInterval(submitToken);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const scheduleTokenContest = async () => {
  try {
    const tokens = await getPendingTokenContestList(20);

    if (tokens.length > 0) {
      //console.log(tokens);
      await getBatchSubmissionContest(tokens);
    } else {
    }
    //else console.log('Token queue empty');
  } catch (error) {
    console.log(error);
  }
};

const scheduleSubmissionOptions: ScheduleOptions = {
  scheduled: false,
  name: "get-submission",
  recoverMissedExecutions: false,
};

const scheduleSubmission = async () => {
  submissionProcessRunning = true;

  try {
    const subs = await getPendingSubmissionListV2(5);

    if (subs && subs.length > 0) {
      subQueueEmptyCnt = 0;
      await sendSubmissionBatchListV2(subs);
    } else {
      subQueueEmptyCnt++;
      if (subQueueEmptyCnt === 50) {
        console.log("STOP submission process");
        submissionProcessRunning = false;
        await submitSubmissionScheduler.stop();
      }
    }
  } catch (error) {
    console.log(error);
  }
};

//const getTokenContest=setInterval(scheduleTokenContest, 50);

let getTokenContest: any;
export {
  submitTokenScheduler,
  submitSubmissionScheduler,
  submitTokenContestScheduler,
  scheduleOff,
  scheduleTokenContest,
  processed,
  tokenProcessRunning,
  submissionProcessRunning,
};
let gettingToken = false;

export const startGetToken = () => {
  gettingToken = true;
  getTokenContest = setTimeout(() => getPendingTokenContest(20), 200);
};
export const stopGetToken = () => {
  if (getTokenContest) {
    clearTimeout(getTokenContest);
    console.log("stop getting token");
    gettingToken = false;
  }
};
export { gettingToken };
export const startSubmitToken = () => {
  //gettingToken = true;
  tokenProcessRunning = true;
  submitToken = setInterval(scheduleToken, 1000);
};
export const stopSubmitToken = () => {
  clearInterval(submitToken);
};

export const startSendSubmission = async () => {
  submissionProcessRunning = true;
  await submitSubmissionScheduler.start();
};

const submitTokenScheduler = cron.schedule(
  "*/1 * * * * *",
  scheduleToken,
  scheduleTokenOptions
);
const submitSubmissionScheduler = cron.schedule(
  "*/1 * * * * *",
  scheduleSubmission,
  scheduleSubmissionOptions
);
const submitTokenContestScheduler = cron.schedule(
  "*/1 * * * * *",
  scheduleTokenContest,
  scheduleTokenContestOptions
);

const calRatingSchedule = cron.schedule(
  "5 8 * * 0",
  checkContestListAndCalRating,
  scheduleCalRatingOptions
);
