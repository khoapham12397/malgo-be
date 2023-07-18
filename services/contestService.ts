import { Prisma, PrismaClient } from "@prisma/client";
import CustomAPIError from "../config/CustomAPIError";

const prisma = new PrismaClient(); 

export type CreateCodingContestParam = {
    title: string;
    description: string;
    realTimeRank: boolean;
    startTime: number; 
    duration: number;
}

export const createCodingContest = async (param: any) =>{
    try{
        const cnt = await prisma.contest.count();
        
        const contest = await prisma.contest.create({
            data: {
                id: (cnt+1).toString(),
                title: param.title,
                description: param.description,
                ruleType: 'acm',
                realTimeRank: param.realTimeRank,
                startTime: new Date(param.startTime),
                duration: param.duration,
                endTime: new Date((new Date(param.startTime)).getTime()+ param.duration*1000)
            }
        });

        return contest;

    }catch(error){
        console.log(error);
        throw error;
    }
}


export const addExistedProblemToContest = async (problemId: string, contestId: string) =>{
    try{
        const problem = await prisma.codingProblem.findUnique({
            where :{
                id: problemId,
            },
            select:{
                contestId: true,   
            }
        });
        
        if(!problem) throw new CustomAPIError('Problem not exited', 400);
        
        if(problem.contestId) {
            throw new CustomAPIError('',400);
        }
        

        await prisma.codingProblem.update({
            where:{
                id: problemId,
            },
            data:{
                contestId: contestId,
            }
        });
        
    }
    catch(error){
        console.log(error);
        throw error;
    }
}
export const getContestList = async (type: string, page: number|undefined) =>{
    try {   

        const itemPerPage = 20;
        let filter = undefined;
        
        if(type!=='live') {
            filter = {
                startTime : type==='upcomming'?{
                gt: new Date(Date.now())
            }:type==='past'?{
                lt : new Date(Date.now()-2*3600*1000)
            }:undefined
            }
        }
        else filter = {
            startTime: {
                lt: new Date(Date.now())
            },
            endTime: {
                gt : new Date(Date.now())
            }
        }

        const total = await prisma.contest.count({
            where : filter,
        })

        const contests = await prisma.contest.findMany({
            skip: page?(page-1)*itemPerPage:undefined,
            where : filter,
        });

        return {
            contests: contests,
            total: total,
            itemPerPage: itemPerPage,
        }
    }catch(error){
        console.log(error);
        throw error;
    }
}

export const getContestInfo = async (contestId: string) =>{
    try{
        return await prisma.contest.findUnique({
            where : {
                id: contestId,
            }
        });
        
    }catch(error){
        console.log(error);
        throw error;
    }
}


export const getContestDetail = async (contestId: string)=>{
    try{
        
        const contest = await prisma.contest.findUnique({
            where: {id: contestId},
            select :{
                id: true,
                title: true,
                description: true,
                startTime: true,
                ruleType: true,
                codingProblems: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        timeLimit: true,
                        memoryLimit: true, 
                        totalPoint: true,
                        visibleFrom: true,
                    }
                }
            }
        });
        
        
        return contest;

    }catch(error){
        console.log(error);
        throw error;
    }
}