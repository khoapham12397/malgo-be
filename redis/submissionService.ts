import dotenv from 'dotenv';
import { generator } from "../utils/genId";
import { ChildSubmissionBatchParam, getBatchSubmissionContest, PostSubContestParam, sendSubmissionBatch, sendSubmissionBatchList, sendSubmissionContest } from "../judgeApi";
import { gettingToken,  startGetToken, startSendSubmission, startSubmitToken, stopGetToken, stopSubmitToken, submissionProcessRunning, submitSubmissionScheduler, submitTokenContestScheduler, submitTokenScheduler, tokenProcessRunning } from "../scheduler";
import {redisClient} from "./baseService";

dotenv.config();
const MAX_SIZE_SUBMISSION_BATCH = 20;
 
const getPendingTokenQueueKey = ()=>{
    return "token:pending:queue";
}

const getPendingSubmissionQueueKey = () =>{
    return "submission:pending:queue";
}
const getPendingSubmissionQueueKeyV2 = () =>{
    return "submission:pending:queue:v2";
}

export const insertPendingSubmission = async (params: ChildSubmissionBatchParam, submissionId: string)=>{
    try{
        const numberItem = Math.ceil(params.testcaseList.length / MAX_SIZE_SUBMISSION_BATCH);
        const lst :Array<string> = [];
        for(let i = 0; i< numberItem ;i++) {
            const startInd = i * MAX_SIZE_SUBMISSION_BATCH;
            const submissions :Array<any> = [];
            for(let j= startInd;j< Math.min(params.testcaseList.length, startInd + MAX_SIZE_SUBMISSION_BATCH);j++){
                const x= {
                    language_id: params.languageId,
                    source_code: params.sourceCode,
                    stdin: params.testcaseList[j].input,
                    expected_output: params.testcaseList[j].answer
                }
                submissions.push(x);
            }
             
            const sub = {
                id: submissionId,
                data: {submissions: submissions},
            }
            console.log('add submissionlst: size=' + submissions.length);
            lst.push(JSON.stringify(sub));
        }

        await redisClient.LPUSH(getPendingSubmissionQueueKey(), lst);

        /*
        params.testcaseList.forEach(testcase=>{
            const x = {
                language_id: params.languageId,
                source_code: params.sourceCode,
                stdin: testcase.input,
                expected_output: testcase.answer
            };
            submissions.push(x);
        });
        */
        if(!submissionProcessRunning) {
            console.log(`restart submission process , status = ${submissionProcessRunning}`);
            //submitSubmissionScheduler.start();
            startSendSubmission();
        }

    }catch(error){
        console.log(error);
    }
}
export type InsertPendingSubParam = {
    submissionId: string;
    languageId: number;
    sourceCode: string; // base64encoded
    testfile: string;
}

export const insertPendingSubmissionV2 = async (params: InsertPendingSubParam)=>{
    try {
        const submissionStr = params.submissionId+":"+params.languageId+":"+params.sourceCode+":"+ params.testfile;
        
        await redisClient.LPUSH(getPendingSubmissionQueueKeyV2(), submissionStr);
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

export const insertPendingSubmissionDirectlyV2 = async(submissionStr: string) =>{
    try {
        await redisClient.LPUSH(getPendingSubmissionQueueKeyV2(), submissionStr);
        if(!submissionProcessRunning) {
            console.log(`restart submission process , status = ${submissionProcessRunning}`);
            //submitSubmissionScheduler.start();
            startSendSubmission();
        }
    }catch(error){
        console.log(error);
        throw error;
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

export const getPendingSubmissionListV2 = async (up: number)=>{
    try{
        const lst = [];
        for(let i=0;i<up;i++) {
            const submissionStr = await redisClient.RPOP(getPendingSubmissionQueueKeyV2());
            if(submissionStr) lst.push(submissionStr);
            else break;
        }
        return lst;
    }
    catch(error){
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
        const tokens:Array<any>= [];
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
        const status:Array<number> = [];
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
        const status:Array<number> = [];
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
        const tokens:Array<any> = [];
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
export const getSubmitedSetOfUserKey = (username:string) =>{
    return `user:submited_problems:${username}`;
}

export const insertSingleProblemSubmited = async (username: string, codingProblemId: string)=>{
    try{       
        const result=await redisClient.SADD(getSubmitedSetOfUserKey(username), codingProblemId);
        return result;
    }
    catch(error){
        console.log(error);
    }
}
export const initUserSubmitedSet = async ()=>{
    try{
        const lst = await getAllProblemUserSubmited();
        const rs=[];
        for(let i=0;i<lst.length;i++) {
            const ok = await redisClient.SADD(getSubmitedSetOfUserKey(lst[i].username), lst[i].problemId);
            rs.push(ok);
        }
        return rs;
    }catch(error){
        throw error;
    }
}
import {CODING_PROBLEM_NP, RecommenderSystemEvent} from "../services/recommendService";
import { getAllProblemUserSubmited } from '../services/submissionService';

export const scanProbSubmitedAllUser = async()=>{
    try{    
        
        const eventList:Array<RecommenderSystemEvent> = [];
        /**
         * ger.events([
    {
      namespace: CODING_PROBLEM_NAMESPACE,
      person: 'yutaka',
      action: 'likes',
      thing: 'xmen',
      expires_at: '2025-06-06'
    },
         */
        let cursor = 0;
        while(true){
            const result = await redisClient.scan(cursor, {
                MATCH: 'user:submited_problems:*',
            });
           
            for(let i=0;i<result.keys.length;i++) {
                const probIds = await redisClient.sMembers(result.keys[i]);
                probIds.forEach(probId=>{
                    eventList.push({
                        action: 'likes',
                        person: result.keys[i].split(':')[2],
                        expires_at: (new Date(Date.now()+ 365*2*24*60*1000)).toString(),
                        namespace: CODING_PROBLEM_NP,
                        thing : probId,
                     });
                });
            }
            //console.log(`cursor: ${result.cursor}`);

            if(result.cursor === 0) break;
            cursor = result.cursor;
        }
        
        return eventList;

    }catch(error){
        throw error;
    }
}

export const excludeProblemsInSubmitedSet = async (username: string, problems: Array<string>)=>{
    try{
        const result = await redisClient.smIsMember(getSubmitedSetOfUserKey(username), problems);
        return problems.filter((item,index)=> result[index] === false);
    }catch(error){
        throw error;
    }
} 

