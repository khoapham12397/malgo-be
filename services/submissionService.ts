import { Prisma, PrismaClient } from "@prisma/client";
import CustomAPIError from "../config/CustomAPIError";
import { insertPendingSubmission, insertPendingTokenDirectly, insertSubmission, insertSubmissionContest } from "../redis/submissionService";
import { generator } from "../utils/genId";
import { ChildSubmissionBatchParam, createChildSubmissionBatch, PostSubContestParam, sendSubmissionContest, TestCaseDescription } from "../judgeApi";
import { getTestCaseOrigin } from "./testcaseService";
import { udpateUserContest, UpdateUserContestParam } from "../redis/contestService";

const prisma = new PrismaClient();

export type SubmissionParam = {
    problemId: string;
    sourceCode: string; // encodebase64 dung:
    username: string;
    language: string;
    contestId: string | undefined; 
    penaltyTime: number | undefined;       
    maxScore: number | undefined;
}

export const createSubmission = async(params: SubmissionParam)=>{
    try {
        /*
        await prisma.submission.create({
            data: {
                id: generator.nextId().toString(),
                code: params.sourceCode,
                createTime: new Date(Date.now()),
                language: params.language,
                problemId: params.problemId,
                shared: true,
                statistic_info: {},
                result:"PENDING",
                username: params.username,
            } 
        });
        

        */
        
        const testcase = await getTestCaseOrigin(params.problemId);
        if(!testcase) {
            throw new CustomAPIError('There are no testcase for this problem', 500);
        }
        
        const submissionId = await insertSubmission(params, testcase.subTestNumber);
        
        const chidlSubBatchParam :ChildSubmissionBatchParam=  {
            languageId: Number(params.language),
            sourceCode: params.sourceCode,
            testcaseList: testcase.description as Array<TestCaseDescription>,
        }

        //createChildSubmissionBatch(chidlSubBatchParam,submissionId);
        insertPendingSubmission(chidlSubBatchParam, submissionId);
        return submissionId;
                
    }catch(error: any) {
        throw error;
    }
}
const judgeStatus = [
    'NONE',
    'PENDING',
    'JUDGING',
    'ACCEPTED',
    'WRONG_ANSWER',
    'REAL_TIME_LIMIT_EXCEEDED',
    'COMPILE_ERROR',
    'RUNTIME_ERROR',

]
export const createSubmissionDB = async(params: SubmissionParam)=>{
    try {
        const testcase = await getTestCaseOrigin(params.problemId);
        if(!testcase) {
            throw new CustomAPIError('There are no testcase for this problem', 500);
        }
        //testcase.description.length;
        const status = testcase.description.map((item:any) => "1");
        let statisticInfo = {};

        if(params.contestId) {
            statisticInfo = {
                penaltyTime: params.penaltyTime,
                maxScore: params.maxScore,
            }
        }

        const submission = await prisma.submission.create({
            data: {
                id: generator.nextId().toString(),
                code: params.sourceCode,
                createTime: new Date(Date.now()),
                language: params.language.toString(),
                problemId: params.problemId,
                shared: true,
                contestId: params.contestId?params.contestId:null,
                statistic_info: statisticInfo as Prisma.JsonObject,
                status: status as Prisma.JsonArray,
                username: params.username,
                result: 'PENDING',
            }
        });        

        //const submissionId = await insertSubmission(params, testcase.subTestNumber);
        
        const chidlSubBatchParam :ChildSubmissionBatchParam=  {
            languageId: Number(params.language),
            sourceCode: params.sourceCode,
            testcaseList: testcase.description as Array<TestCaseDescription>,
        }

        //createChildSubmissionBatch(chidlSubBatchParam,submissionId);
        insertPendingSubmission(chidlSubBatchParam, submission.id);
        return submission.id;
                
    }catch(error: any) {
        console.log(error);
        throw error;
    }
}


type StatusUpdate = {
    statusId: number;
    index: number;
    token: string;
}
export const updateSubmissonDBStatus = async(submissionId: string, statusArr: Array<StatusUpdate>) =>{
    try{
        const nextTokens : Array<string> = [];

        const submission :any = (await prisma.submission.findUnique({
            where: {
                id :submissionId,
            },
            select:{
                status: true,
                contestId: true,
                statistic_info: true,
                problemId: true,
                username: true,
            }
        }));

        if(!submission)throw new CustomAPIError('Bad request',400);

        const status= submission.status;
        const contestId = submission.contestId;

        statusArr.forEach(item => {
            if(item.statusId < 3) {
                nextTokens.push(item.token+':'+item.index);
            }
            status[item.index] = item.statusId;
        });
        

        let updateData : any; 
        if(nextTokens.length === 0){      
            let result:any = 3;
            for(let i=0;i<status.length;i++) {
                if(Number(status[i]) != result) {
                    result = Number(status[i]);
                    break;
                }
            }       
            result= result>7?'RUNTIME_ERROR':judgeStatus[result];

            updateData  = {
                status: status as Prisma.JsonArray,
                result: result,
            }

            if(contestId){
                
                const param : UpdateUserContestParam = {
                    contestId: contestId,
                    correct: result==='ACCEPTED',
                    maxScore: submission.statistic_info.maxScore,
                    penaltyTime: submission.statistic_info.penaltyTime,
                    problemId: submission.problemId,
                    username: submission.username,
                }
                udpateUserContest(param);
            }

        }
        else {
            updateData ={
                status: status as Prisma.JsonArray,
            }
        }
        
        await prisma.submission.update({
            where: {
                id: submissionId,
            },
            data: updateData
        });
        
        if(nextTokens.length>0){
            //await redisClient.LPUSH(getPendingTokenQueueKey(), JSON.stringify([submissionId, nextTokens]));
            await insertPendingTokenDirectly(JSON.stringify([submissionId, nextTokens]));            
        }
    }catch(error){
        throw error;
    }
    
}
export const createSubmissionContest = async(params: SubmissionParam)=>{
    try {
        
        const testcase = await getTestCaseOrigin(params.problemId);
        if(!testcase) {
            throw new CustomAPIError('There are no testcase for this problem', 500);
        }
        
        
        const submissionId= await insertSubmissionContest(params, testcase.subTestNumber);
        
        
        const pr: PostSubContestParam = {
            index: 0,
            languageId: Number(params.language),
            problemId: params.problemId,
            sourceCode: params.sourceCode,
            submissionId: submissionId,
        }
        
        sendSubmissionContest(pr);
        
        return submissionId;
                
    }catch(error: any) {
        throw error;
    }
}


export const getSubmissionStatus = async (submissionId: string) =>{
    try {     
        return await prisma.submission.findUnique({
            where: {
                id: submissionId,
            }
            ,select: {
                status: true, 
                result: true,
            }
        });
        
    }catch(error){
        console.log(error);
        throw error;
    }
}
export const getSubmissionList = async (page: number, username: string | undefined) =>{
    try{
        const itemPerPage = 20;
        const filter = username? {
            username: username
        }: undefined;

        const submissions = await prisma.submission.findMany({
            skip: (page -1)* itemPerPage, 
            take: itemPerPage,
            where : filter,
            orderBy : {
                id: 'desc',
            }
        });
        const total = await prisma.submission.count({
            where : filter
        });

        return {
            submissions: submissions,
            total: total,
            itemPerPage: itemPerPage,
        };
        
    }catch(error){
        console.log(error);
        throw error;
    }
}
export const getSubmissionsProblem = async(page: number,problemId: string, username: string | undefined) =>{
    try{
        const filter = {
            problemId: problemId,
            username: username,
        }
        const itemPerPage = 20;
        const submissions = await prisma.submission.findMany({
            skip : (page-1) * itemPerPage,
            take: itemPerPage,
            where: filter,
            orderBy: {
                id: 'desc',
            }
        });
        const total = await prisma.submission.count({
            where: filter,
        });
        return {
            submissions: submissions,
            total: total,
            itemPerPage: itemPerPage,
        }

    }catch(error){
        console.log(error);
        throw error;
    }
}