import dotenv from 'dotenv';
import axios from "axios";
import {insertPendingContestToken, insertPendingSubmissionDirectly, insertPendingTokens, UpdateSubContestParam, updateSubmissionContestStatus, updateSubmissionStatusV2} from "./redis/submissionService";
import { getTestCaseOrigin } from './services/testcaseService';
import CustomAPIError from './config/CustomAPIError';
import { fail } from 'assert';
import { updateSubmissonDBStatus } from './services/submissionService';


dotenv.config()

const instance = axios.create({
    baseURL : process.env.JUDGE_SERVER_URL || 'http://localhost:2358'
});
let failTime = 0;

export const apiJudge = {
    get:  (url : string) => {
    /*  
    let jwt =  getAccessTokenFromStorage();
      if (!isEmptyString(jwt)) {
        jwt = auth_type + ' ' + jwt;
      } else {
        jwt = '';
      };
      */
      return  instance.get(`${url}`);
    },
    post:  (url: string, req: any) => {
      
      return  instance.post(`${url}`, req);
    },
    put:  (url :string, req: any) => {
     
      return  instance.put(`${url}`, req);
    },
    patch:  (url:string, req:any) => {
     
      return  instance.patch(`${url}`, req);
    },
    delete: (url:string) => {
        
      return instance.delete(`${url}`);
    }
  }
export type TestCaseDescription  = {
    input: string;
    answer: string;
}

export type ChildSubmissionBatchParam = {
    languageId : number,
    sourceCode: string;
    testcaseList : Array<TestCaseDescription>;    
}


export const createChildSubmissionBatch = async (params: ChildSubmissionBatchParam, submissionId: string) =>{
    try{
        const url = '/submissions/batch?base64_encoded=true';
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
        //console.log("submissions:");
        //console.log(submissions);

        const data = {
            submissions: submissions
        };
        const result = await apiJudge.post(url, data );
        if(result.status == 201) {
          const tokens = result.data;
          await insertPendingTokens(tokens, submissionId);

          return [];
        }
    }catch(error){
      console.log(error);
    }
}


export const sendSubmissionBatch = async (subStr: string)=>{
  const sub:any = JSON.parse(subStr);

  try{  
    const url = '/submissions/batch?base64_encoded=true';
    const data = sub.data;
    const result = await apiJudge.post(url, data);
    
    if(result.status === 201){
      const tokens = result.data;
      await insertPendingTokens(tokens, sub.id);
    }
    
  }catch(error){
    failTime++;
    console.log(`pick sub return to queue : ${sub.id}:  ${failTime}`);
    //await insertPendingSubmission()
    
    await insertPendingSubmissionDirectly(subStr);
  }
}

export const sendSubmissionBatchList = async (subs: Array<string>) =>{
  subs.forEach(subStr=>{
    sendSubmissionBatch(subStr);
  });
}

export const getBatchSubmission = async(tokens : Array<any>)=>{
  try{
    const mapTokenSubmission = new Map<string,{submissionId:string, index: number}>();
    let tokenStr='';
    

    tokens.forEach((item,ind)=>{
      item[1].forEach((tokenAndIndex:any,index:number) => {
        const arr = tokenAndIndex.split(':');

        mapTokenSubmission.set(arr[0], {
          index: arr[1], submissionId: item[0]
        });
        tokenStr += arr[0];
        if(!(ind === tokens.length-1 && index=== item[1].length-1))
          tokenStr += ',';
      })
    });
    
    const url = '/submissions/batch?tokens='+tokenStr+"&base64_encoded=true";
    const result = await apiJudge.get(url);
    const mapUpdateSubmission = new Map<string,Array<any>>();
    

    if(result.status===200) {
      const submissions = result.data.submissions;
      submissions.forEach((item:any)=>{
        const submissionAndIndex = mapTokenSubmission.get(item.token);
        if(submissionAndIndex) {
          const arr = mapUpdateSubmission.get(submissionAndIndex.submissionId);
          if(!arr) {
            
            mapUpdateSubmission.set(submissionAndIndex.submissionId, [{
              statusId: item.status.id, 
              index : submissionAndIndex.index,
              token: item.token,
            }]);
            
          }
          else {
            arr.push({
              statusId: item.status.id, 
              index : submissionAndIndex.index,
              token: item.token,
            })
          }
        }
      });
     

      const arrUpdate = Array.from(mapUpdateSubmission);
      arrUpdate.forEach(item=>{
        // van de nen change the nao cho de ks dung://a:

        //updateSubmissionStatusV2(item[0],item[1]);
        updateSubmissonDBStatus(item[0], item[1]);
        
      });
    }
  }catch(error){
    console.log(error);
    
  }
}
export const getBatchSubmissionContest = async (tokens: Array<string>)=>{
  try{
    // format : token:subId:index =
    const mapTokenSubmission = new Map<string, {
      submissionId: string; index: number;
    }>();
    let tokenStr = '';
    //console.log(tokens);
    tokens.forEach((item,index) => {
      const arr = item.split(':');
      mapTokenSubmission.set(arr[0], {index: Number(arr[2]),submissionId: arr[1] });
      tokenStr += arr[0];
      if(index!== tokens.length-1) tokenStr+=',';
    })
    const url = '/submissions/batch?tokens='+tokenStr+"&base64_encoded=true";
    const result = await apiJudge.get(url);
    if(result.status === 200 ){
      const submissions = result.data.submissions;
      submissions.forEach((item:any)=>{
        const obj = mapTokenSubmission.get(item.token);
        if(obj) {
          const updateParam : UpdateSubContestParam = {
            index: obj.index,
            statusId: item.status.id,
            submissionId: obj.submissionId,
            token: item.token, 
          }
          updateSubmissionContestStatus(updateParam);
        }
      });
    }
    else{
      // TODO 
      console.log(result.data);

    }
  }catch(error){
    console.log('error at get batch submission contest result');
  }
}

export type PostSubContestParam = {
  problemId: string; 
  index: number; 
  submissionId: string; 
  languageId: number;
  sourceCode: string;
}

export const sendSubmissionContest = async(param: PostSubContestParam)=>{
  try{
    const testcase: any = await getTestCaseOrigin(param.problemId);
    if(!testcase) throw new CustomAPIError('No Testcase', 500);
    //console.log(testcase);
    
    const data = {
      language_id: param.languageId,
      source_code: param.sourceCode,
      stdin: testcase.description[param.index].input,
      expected_output: testcase.description[param.index].answer 
    }
    //console.log(data);
    
    const url = '/submissions?base64_encoded=true';
    const result = await apiJudge.post(url, data);
    if(result.status === 201) {
      await insertPendingContestToken(result.data.token,param.submissionId, param.index);      
    }
    else {
     
    }
  }catch(error){
    //console.log(error);
    failTime++;
    console.log('error at send submission contest');
    console.log(`failTime:${failTime}`)
  }
}

