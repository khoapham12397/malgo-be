import { createClient } from "redis";
import { ShareParam } from "../controllers/userController2";
import dotenv from "dotenv";
import { generator } from "../utils/genId";
import {
  ChildSubmissionBatchParam,
  getBatchSubmissionContest,
  PostSubContestParam,
  sendSubmissionBatch,
  sendSubmissionBatchList,
  sendSubmissionContest,
} from "../judgeApi";
import {
  gettingToken,
  startGetToken,
  startSendSubmission,
  startSubmitToken,
  stopGetToken,
  stopSubmitToken,
  submissionProcessRunning,
  submitSubmissionScheduler,
  submitTokenContestScheduler,
  submitTokenScheduler,
  tokenProcessRunning,
} from "../scheduler";

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const initRedisClient = async () => {
  redisClient.on("error", (error) => {
    console.log(error);
  });
  await redisClient.connect();
};

const generateUserSocketsKey = (username: string) => {
  return `sockets:${username}`;
};
export const insertUserSocket = async (username: string, socketId: string) => {
  try {
    const socketsStr = await redisClient.GET(generateUserSocketsKey(username));
    if (socketsStr) {
      const sockets = JSON.parse(socketsStr);
      sockets.push(socketId);
      await redisClient.SET(
        generateUserSocketsKey(username),
        JSON.stringify(sockets)
      );
    } else {
      const sockets = JSON.stringify([socketId]);
      await redisClient.SET(generateUserSocketsKey(username), sockets);
    }
  } catch (error) {
    throw error;
  }
};
export const setUserSockets = async (
  username: string,
  socketIds: Array<string>
) => {
  try {
    await redisClient.SET(
      generateUserSocketsKey(username),
      JSON.stringify(socketIds)
    );
  } catch (error) {
    console.log(error);
  }
};
export const removeUserSocket = async (username: string, socketId: string) => {
  try {
    const socketsStr = await redisClient.GET(generateUserSocketsKey(username));
    if (socketsStr) {
      const sockets = JSON.parse(socketsStr);
      for (let i = 0; i < sockets.length; i++) {
        if (sockets[i] == socketId) {
          sockets.splice(i, 1);
          break;
        }
      }
      if (sockets.length == 0) {
        await redisClient.DEL(generateUserSocketsKey(username));
      } else {
        await redisClient.SET(
          generateUserSocketsKey(username),
          JSON.stringify(sockets)
        );
      }
    }
  } catch (error) {
    throw error;
  }
};

export const getUserSockets = async (username: string) => {
  try {
    const socketsStr = await redisClient.GET(generateUserSocketsKey(username));
    if (socketsStr) {
      return JSON.parse(socketsStr);
    }
    return [];
  } catch (error) {
    throw error;
  }
};
export const checkUserSocketExist = async (username: string) => {
  try {
    const socketsStr = await redisClient.GET(generateUserSocketsKey(username));
    return socketsStr !== null;
  } catch (error) {
    throw error;
  }
};
/*
const getPendingTokenQueueKey = ()=>{
    return "token:pending:queue";
}

const getPendingSubmissionQueueKey = () =>{
    return "submission:pending:queue";
}

export const insertPendingSubmission = async (params: ChildSubmissionBatchParam, submissionId: string)=>{
    try{
        const submissions : Array<any> = [];
        params.testcaseList.forEach(testcase=>{
            const x = {
                language_id: params.languageId,
                source_code: params.sourceCode,
                stdin: testcase.input,
                expected_output: testcase.answer
            };
            submissions.push(x);
        });
        
        const data = {
            submissions: submissions
        }; 
        const sub = {
            id: submissionId,
            data: data,
        }

        await redisClient.LPUSH(getPendingSubmissionQueueKey(), JSON.stringify(sub));
        if(!submissionProcessRunning) {
            console.log(`restart submission process , status = ${submissionProcessRunning}`);
            //submitSubmissionScheduler.start();
            startSendSubmission();
        }

    }catch(error){
        console.log(error);
    }
}
export const insertPendingSubmissionDirectly = async (subStr: string) =>{
    try{
        await redisClient.LPUSH(getPendingSubmissionQueueKey(), subStr);
        if(!submissionProcessRunning) {
            console.log(`restart submission process , status = ${submissionProcessRunning}`);
            submitSubmissionScheduler.start();
        }
    }catch(error){
        console.log(error);
    }
}
export const insertPendingTokens = async (tokens :Array<any>, submissionId:string) =>{
    try{
        //const pendingList = tokens.map((item,index)=> item.token + ":"+submissionId+":"+index); 
        //await redisClient.LPUSH(getPendingTokenQueueKey(), pendingList);
        const token = [submissionId, tokens.map((item,index)=> item.token+':'+index)];
        await redisClient.LPUSH(getPendingTokenQueueKey(), JSON.stringify(token));
        checkAndRestartTokenProcesss();
        
    }catch(error){
        throw error;
    }
}
export const insertPendingTokenDirectly = async (token: string) =>{
    try{    
        await redisClient.LPUSH(getPendingTokenQueueKey(), token);
        // nen set up theo caigi da:
        checkAndRestartTokenProcesss();
    
    }catch(error){
        throw error;
    }
}

export const getPendingSubmission = async (up: number) =>{
    try{
        const subStr = await redisClient.RPOP(getPendingSubmissionQueueKey());
        return subStr;
        
    }catch(error){
        console.log(error);
    }
}

export const getPendingSubmissionList = async (up: number )=>{
    try{
        const lst:Array<string>= [];
        for(let i=0;i<up;i++) {
            const subStr = await redisClient.RPOP(getPendingSubmissionQueueKey());
            if(subStr) lst.push(subStr);
            else break;
        }
        return lst;

    }catch(error){
        console.log(error);
    }
}
const checkAndRestartTokenProcesss = () =>{
    if(!tokenProcessRunning) {
        console.log('restart token process');
        startSubmitToken();
    }
}

export const taskGetPendingTokens = async (maxToken: number) =>{
    try{
        const tokens = [];
        let cnt = 0;
        while(true) {
            const tokenStr = await redisClient.RPOP(getPendingTokenQueueKey());
            if(!tokenStr) break;
            const token = JSON.parse(tokenStr); 
            const x = token[1].length;
            if(cnt + x > maxToken) {
                await redisClient.RPUSH(getPendingTokenQueueKey(), tokenStr);
                checkAndRestartTokenProcesss();
                break;
            }
            tokens.push(token);
            cnt+=x;
        }
        return tokens;

    }catch(error){
        throw error;
    } 
}

type SubmissionParam = {
    problemId: string;
    sourceCode: string; // encodebase64 dung:
    username: string;
    language: string;    
}

const getSubmissionKey = (submissionId: string)=>{
    return `submission:${submissionId}`;
}

export const insertSubmission = async(param: SubmissionParam, testCnt: number)=>{
    try {
        const submissionId = generator.nextId().toString();
        const status = [];
        for(let i=0;i<testCnt;i++) status.push(1);
        
        await redisClient.HSET(getSubmissionKey(submissionId),
            [   
            "problemId",param.problemId,
            "sourceCode", param.sourceCode, 
            "username", param.username, 
            "language",param.language, 
            "status", JSON.stringify(status),
            "finish",0
            ]
        );
        
        return submissionId;

    }catch(error){
        throw error;
    }
}


export const updateSubmissionStatus = async(submissionId:string, index: number, statusId: number)=>{
    try{
        const key = getSubmissionKey(submissionId);
        const status = await redisClient.HGET(key, "status");
        if(status){
            const statusArr=JSON.parse(status);
            statusArr[index] = statusId; 
            await redisClient.HSET(key, "status", JSON.stringify(statusArr));
        }
        
    }catch(error){
        throw error;
    }
}
type StatusUpdate = {
    statusId: number;
    index: number;
    token: string;
}

export const updateSubmissionStatusV2 = async (submissionId: string, status: Array<StatusUpdate>)=>{
    try{
        const key = getSubmissionKey(submissionId);
        const currentStatus = await redisClient.HGET(key, "status");
        const nextTokens:any = [];
        
        //console.log(`update status of submission ${submissionId}`);
        if(currentStatus){
            const statusArr = JSON.parse(currentStatus);
            status.forEach(item => {
                statusArr[item.index] = item.statusId;
                if(item.statusId < 3) {
                    nextTokens.push(item.token+':'+item.index);
                }
            });
            //console.log(`update status of submission: ${submissionId}`);
            //console.log(statusArr);
            
            
            if(nextTokens.length>0){
                await redisClient.HSET(key,"status", JSON.stringify(statusArr));
                await redisClient.LPUSH(getPendingTokenQueueKey(), JSON.stringify([submissionId, nextTokens]));
                //if(scheduleOff) submitTokenScheduler.start();
            }
            else await redisClient.HSET(key,["status", JSON.stringify(statusArr),'finish',1]);
            
        }
    }catch(error){
        throw error;
    }
}

const getSubmissionContestKey = (submissionId: string)=>{
    return `submission:contest:${submissionId}`;
}

export const insertSubmissionContest = async(param: SubmissionParam, testCnt: number)=>{
    try {
        const submissionId = generator.nextId().toString();
        const status = [];
        for(let i=0;i<testCnt;i++) status.push(1);
        
        await redisClient.HSET(getSubmissionContestKey(submissionId),
            [   
            "problemId",param.problemId,
            "sourceCode", param.sourceCode, 
            "username", param.username, 
            "language",param.language, 
            "status", JSON.stringify(status),
            "updated", 0
            ]
        );
        
        return submissionId;

    }catch(error){
        throw error;
    }
}
const getPendingTokenContestQueueKey =()=>{
    return "token:contest:pending:queue";
}

export const insertPendingContestToken = async (token:string,submissionId:string,index: number) =>{
    try{
        const tk = token+':'+submissionId+':'+index;
        //console.log(`insert pending contest token: ${tk}`);

        await redisClient.LPUSH(getPendingTokenContestQueueKey(), tk);
        if(!gettingToken) startGetToken();
    
    }catch(error){
        throw error;
    }
}

export const getPendingTokenContestList = async(up : number) =>{
    try{
        const tokens = [];
        for(let i=0;i<up;i++) {
            const token = await redisClient.RPOP(getPendingTokenContestQueueKey());
            if(token) tokens.push(token);
            else break;
        }
        return tokens;
        
    }catch(error){
        throw error;
    }
} 

export const getPendingTokenContest = async(up: number) =>{
    try{
        let tokens:any = [];
        console.log('start getting token');
        while(true) {
            const rs = await redisClient.RPOP(getPendingTokenContestQueueKey());
            if(rs ){
                tokens.push(rs);
                if(tokens.length === up) {
                    getBatchSubmissionContest([...tokens]);
                    tokens = [];
                }
            }
            else {
                if(tokens.length>0)  getBatchSubmissionContest([...tokens]);
                //stopGetToken()
                tokens = [];
                
            }
        }
    }catch(error){
        throw error;
    }
}

export type UpdateSubContestParam = {
    token: string;
    submissionId: string;
    statusId: number;
    index: number;
}

export const updateSubmissionContestStatus = async(param: UpdateSubContestParam)=>{
    try{    
        const key = getSubmissionContestKey(param.submissionId);
        const x = await redisClient.HMGET(key, ["status", "updated","sourceCode", "language","problemId"]);
        
        const statusArr = JSON.parse(x[0]);
        statusArr[param.index] = param.statusId;
        

        let updated:any = Number(x[1]) + ((param.statusId >=3 )?1:0);
        if(updated === statusArr.length) {
            updated = 'all';
        }
        
        //console.log(`update submission contest status ${param.submissionId}`);
        //console.log(statusArr);
        await redisClient.HSET(key, ["status",JSON.stringify(statusArr), "updated", updated]);
        if(param.statusId < 3) {
            await insertPendingContestToken(param.token, param.submissionId, param.index);

        }
        else if(updated<statusArr.length){
            const pr : PostSubContestParam= {
                index: updated,
                languageId: Number(x[3]),
                problemId: x[4],
                sourceCode: x[2],
                submissionId: param.submissionId,
            }
            
            await sendSubmissionContest(pr);
        }
        else {
            const finished= await redisClient.INCR('finish_cnt');
            console.log(`finish update ${finished}`);
        }
    }catch(error){
        console.log('error at update submission status');
        // TODO : many thing here
    }
}

export const getTestcase = async(testcaseId: string) =>{
    try{
        const testcase = await redisClient.GET(`testcase:${testcaseId}`)
        if(testcase )
            return JSON.parse(testcase);
        return null;
    }catch(error){
        throw error;
    }
}

export const insertTestcase = async(testcaseId: string, testcase: string ) =>{
    try{
        await redisClient.SET(`testcase:${testcaseId}`, testcase);
    }catch(error){
        throw error;
    }
}
const checkFinishStatus = (statusArr: Array<number>) =>{
    for(let i=0;i<statusArr.length;i++) {
        if(statusArr[i] < 3 ) return false;
    }
    return true;
}

export const checkSubmissionStatus = async()=>{
    try{
        const result = await redisClient.SCAN(0, {
            MATCH: 'submission:*'
        });
        let cnt = 0;
        for(let i=0;i<result.keys.length;i++){
            const status = await redisClient.HGET(result.keys[i],"status");
            if(status) {
                if(checkFinishStatus(JSON.parse(status)) === false) cnt++;
            }
        };
        
        console.log(`not finish cnt: ${cnt}`);
    }catch(error){
        console.log(error);
    }
}
export const findSubmissionStatus = async (submissionId: string) =>{
    try{
        return await redisClient.HMGET(getSubmissionKey(submissionId), ['status','finish']);
    }catch(error){
        throw error;
    }   
}


export type UpdateUserContestParam = {
    username: string;
    maxScore: number;
    penaltyTime: number;// number second from contest begin time 
    correct: boolean;
    problemId: string;
    contestId: string;
}
export const getUserContestKey = (username: string, contestId: string) =>{
    return `contest:${contestId}:user:${username}`;
}
const calScore = (maxScore: number, penaltyTime: number)=>{
    return maxScore - Math.floor(penaltyTime/60);
}

export const udpateUserContest = async (param: UpdateUserContestParam)=>{
    try {
        // store format contest:id:user:id 
        
        const key = getUserContestKey(param.username, param.contestId);
        
        const x = await redisClient.HMGET(key , [`problem:${param.problemId}`, 'totalScore']);
        if(x[1]) {
            const currentScore = Number(x[1]);
            if(x[0]) {
                const problemResult = JSON.parse(x[0]);
                if(problemResult.score > 0) {
                    return;
                }
                if(param.correct) {
                    const score = param.maxScore-Math.floor(param.penaltyTime/60);
                    problemResult.score = score;
                    problemResult.time = param.penaltyTime;
                    await redisClient.HSET(key, [
                        `problem:${param.problemId}`, JSON.stringify(problemResult),
                        'totalScore' , currentScore + score 
                    ]);
                    await updateContestUserRank(param.contestId, param.username, currentScore+score);
                }
                else {
                    problemResult.failedCnt++;
                    await redisClient.HSET(key, `problem:${param.problemId}`, JSON.stringify(problemResult));
                }   
            }
            else {
                let result,score = 0;
                if(param.correct) {
                    score = calScore(param.maxScore, param.penaltyTime)
                    result = {
                        score: score,
                        time: param.penaltyTime,
                        failedCnt: 0,
                    }                    
                    await redisClient.HSET(key, 
                        [
                            `problem:${param.problemId}`, JSON.stringify(result),
                            'totalScore' , currentScore + score
                        ]);
                }
                else {
                    result = {score: 0, time: 0, failedCnt: 1};
                    await redisClient.HSET(key, `problem:${param.problemId}`, JSON.stringify(result));
                }
                if(score > 0) {
                    await updateContestUserRank(param.contestId,param.username, score+currentScore);
                }
            }
        }
        else {
            const score = calScore(param.maxScore, param.penaltyTime);
            
            let result,totalScore=0;
            
            if(param.correct) {
                result = {score: score, time: param.penaltyTime, failedCnt: 0}
                totalScore = score;
            }   
            else {
                result = {
                    score: 0, time: 0, failedCnt: 1,
                }
            }

            await redisClient.HSET(key, 
                [
                'totalScore', totalScore,
                `problem:${param.problemId}`, JSON.stringify(result)
                ]
            );
            if(score > 0) {
                await updateContestUserRank(param.contestId, param.username, score);
            }
        }
      

    }catch(error){
        console.log(error);
        
    }
}

const getContestRankKey = (contestId: string) =>{
    return `contest:${contestId}:rank`;
}
export const getContestUserResult = async (contestId: string, username: string) =>{
    try{
        const key = getUserContestKey(username, contestId);
        //console.log(`get usercontest result: ${key}`)
        const result = await redisClient.HGETALL(key);
        const scores = [];
        const ans : any={};
        //console.log(result);
        for(const k in result) {
            if(k!=='totalScore') {
                //ans[k] = JSON.parse(result[k]);
                let score:any = JSON.parse(result[k]);
                score.problemId = k.split(':')[1];
                scores.push(score);
            }   
            else ans[k] = Number(result[k]);
        }
        ans.scores = scores;
        ans.username = username;
        return ans;
        
    }

    catch(error){
        console.log(error);
    }
}
export const updateContestUserRank = async(contestId: string, username: string, score: number)=>{
    try{
        const key = getContestRankKey(contestId);
        await redisClient.zAdd(key, {score: score, value: username});

    }catch(error){
        console.log(error);
    } 
}

export const getContestUserRank = async (contestId: string, start: number, end: number)=>{
    try{
        const key = getContestRankKey(contestId);
        const lst = await redisClient.zRangeWithScores(key, start,end, {
            REV: true
        });
        const results = [];
        //console.log(lst);
        const total = await redisClient.zCard(key);

        for(let i=0; i<lst.length;i++){
            results.push(await getContestUserResult(contestId,lst[i].value));
        }
        return {
            standing: results, 
            total: total,
        };
         
    }catch(error){
        console.log(error);
    }
}
const getLiveContestKey = (contestId: string) => {
    return `contest:${contestId}:live:info`;
}
type ProblemContestSummary = {
    id: string;
    title: string;
    maxScore: number;
}

export type AddLiveContestParam = {
    contestId: string;
    startTime: Date;
    endTime: Date;
    problems : Array<ProblemContestSummary>;
}

const getLiveContestSetKey = () =>{
    return "live:contests";
}


export const addLiveContest = async (param: AddLiveContestParam) =>{
    try{
        const key = getLiveContestKey(param.contestId);
        // problemList -> starttime, duration  
        const result = await redisClient.HSET(key, [
            "startTime" , param.startTime.toString(), 
            "endTime" , param.endTime.toString(),
            "problems" , JSON.stringify(param.problems)
        ]);
        
        await redisClient.SADD(getLiveContestSetKey(), param.contestId);
        
        return result;
    }catch(error){
        console.log(error);
        throw error;
    }
}
export const getLiveContestInfoList = async() => {
    try{       
        const contestIds = await redisClient.sMembers(getLiveContestSetKey());
        const contests = [];
        
        for(let i=0;i<contestIds.length;i++) {
            const contest = await redisClient.HGETALL(getLiveContestKey(contestIds[i]));
            contests.push({
                startTime: contest.startTime,
                endTime: contest.endTime, 
                problems: JSON.parse(contest.problems),
            });
        }
        return contests;

    }catch(error){
        console.log(error);
        throw error;
    } 
}
*/
