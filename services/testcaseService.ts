import { PrismaClient } from "@prisma/client";
import { copyFileSync } from "fs";
import CustomAPIError from "../config/CustomAPIError";
import { getTestcase, insertTestcase } from "../redis/submissionService";
import fs from 'fs';
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

export const cleanTestCase = async ()=>{
    try{
        const lst = await prisma.testcase.findMany({
            where: {
                subTestNumber: {gt: 20}
            }
        });
        const result = lst.map((item) => (
           {
            id:item.id,
            //problemId: item.problemId,
            subTestNumber: 20,
            description: item.description?(item.description as any).slice(0,20):[],
            }));
        for(let i=0;i<result.length;i++) {
            await prisma.testcase.update({
                where : {
                    id: result[i].id,
                },
                data:{
                    description: result[i].description,
                    subTestNumber: 20,
                }
            })
        }
        console.log(result.length);
    }catch(error){
        console.log(error);
        throw error;
    }
}

export const readTestCaseFile = (filename: string ) =>{
    try{
        let fileText = fs.readFileSync(filename);
        return JSON.parse(fileText.toString());
    }catch(error){
        console.log(error);
        throw error;
    }
}
export const getTestfileName = (problemId: string) =>{
    const filename = `testcases/testcase_${problemId}_0.json`;
    return fs.existsSync(filename)?filename:null;    
}

export const getNumberSubTest = async (testCaseId: string ) =>{
    const testcase= await prisma.testcase.findUnique({
        where: {id: testCaseId},
        select: {
            subTestNumber: true,
        }
    });    
    return testcase?testcase.subTestNumber:0;
}
export const getTestCaseID = (problemId:string) =>{
    return problemId + "_0";
    
}