import CustomAPIError from "../config/CustomAPIError";
import {getTestCaseOrigin} from "../services/testcaseService";
import {insertSubmission } from "../redis/submissionService";
import {generator} from "../utils/genId";
import { apiJudge, ChildSubmissionBatchParam, TestCaseDescription } from "../judgeApi";
import { createSubmissionDBV2, SubmissionParam } from "../services/submissionService";

export const testCreateBatchSubmission = async()=>{
    try{
        const testcase = await getTestCaseOrigin("1792A");
        if(!testcase) {
            throw new CustomAPIError('There are no testcase for this problem', 500);
        }
        
        const submissionId = generator.nextId().toString();

        const chidlSubBatchParam :ChildSubmissionBatchParam=  {
            languageId: 71,
            sourceCode: "Zm9yIHMgaW5bKm9wZW4oMCldWzI6OjJdOnByaW50KGxlbihhOj1zLnNwbGl0KCkpLWEuY291bnQoJzEnKS8vMik=",
            testcaseList: testcase.description as Array<TestCaseDescription>,
        }
        const url = '/submissions/batch?base64_encoded=true';
        const submissions : Array<any> = [];
        chidlSubBatchParam.testcaseList.forEach(testcase=>{
            const x = {
                language_id: 71,
                source_code: chidlSubBatchParam.sourceCode,
                stdin: testcase.input,
                expected_output: testcase.answer
            };
            submissions.push(x);
        });
       
        const data = {
            submissions: submissions
        };
        // neu dung fetch dung: thi ??a

        const result = await apiJudge.post(url, data );
        if(result.status === 201) {
          const tokens = result.data;
          //await insertPendingTokens(tokens, submissionId);
          console.log(tokens)
          return [];
        }
        else {
            console.log(result.status);
            console.log(result.data);
        }
    }catch(error){
        //console.log(error);
        console.log("some error ");
    } 
}
export const testCreateSubmission = async()=>{
    try{
        const testcase = await getTestCaseOrigin("1792A");
        if(!testcase) {
            throw new CustomAPIError('There are no testcase for this problem', 500);
        }
      
        const url = '/submissions?base64_encoded=true';

        
        const data = {
                language_id: 71,
                source_code: "Zm9yIHMgaW5bKm9wZW4oMCldWzI6OjJdOnByaW50KGxlbihhOj1zLnNwbGl0KCkpLWEuY291bnQoJzEnKS8vMik=",
                stdin: (testcase.description as Array<any>)[0].input,
                expected_output: (testcase.description as Array<any>)[0].answer
            };
       
        
        const result = await apiJudge.post(url, data );
        if(result.status === 201) {
          const token = result.data;
          //await insertPendingTokens(tokens, submissionId);
          console.log(token);
          return [];
        }
        else {
            console.log(result.status);
            console.log(result.data);
        }
    }catch(error){
        //console.log(error);
        console.log("some error ");
    } 
}
export const checkSubmissionStatus = async()=>{
    try{
    
    }catch(error){
        console.log(error);
    }
}
export const testSubmissionService = async () =>{
    const param: SubmissionParam = {
        contestId: undefined,
        language: "71",
        maxScore: 0,
        penaltyTime: 0,
        problemId: '1792A',
        sourceCode: "Zm9yIHMgaW5bKm9wZW4oMCldWzI6OjJdOnByaW50KGxlbihhOj1zLnNwbGl0KCkpLWEuY291bnQoJzEnKS8vMik=",
        username: 'khoa.pham12397@ami1cXdWCn497Qto3rZWT9'
    }
    // cu tao 1 thang dung;  da:.
    const subId = await createSubmissionDBV2(param);
    
}

let cnt = 0;
export const startTestSub = ()=>{
const testMulitSub = setInterval(()=>{
    testSubmissionService();
    cnt++;

    if(cnt >= 100) clearInterval(testMulitSub);
},200);
}
