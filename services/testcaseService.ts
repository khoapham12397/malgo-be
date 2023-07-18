import { PrismaClient } from "@prisma/client";
import CustomAPIError from "../config/CustomAPIError";
import { getTestcase, insertTestcase } from "../redis/submissionService";

const prisma = new PrismaClient();

export const getTestCaseOrigin = async(problemId: string)=>{
    try{   
        //const testcaseId = problemId+'_0';
        const testcase = await getTestcase(problemId+'_0');
        if(!testcase){
            const ts = await prisma.testcase.findUnique({
                where: {
                    id : problemId+'_0',
                }
            });
            if(ts ){
                insertTestcase(ts.id, JSON.stringify(ts));
                return ts;
            }
            else throw new CustomAPIError('No test case', 500);
        }        
        else return testcase;        
    }catch(error){
        throw error;
    }
}