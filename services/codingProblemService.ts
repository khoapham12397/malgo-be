import { PrismaClient } from '@prisma/client';
import CustomAPIError from '../config/CustomAPIError';
import { writeTestcase } from './testcaseService';
import { uuid } from 'short-uuid';

const prisma = new PrismaClient();

export const getProblem = async (problemId: string) => {
  try {
    const codingProblem = await prisma.codingProblem.findUnique({
      where: {
        id: problemId
      },
      include: {
        contest: {
          select: {
            id: true,
            startTime: true,
            duration: true,
          }
        }
        ,
        codeforcesTag: {
          select:{
            codeforcesTagId: true,
          }
        }
      }
    });
    if(codingProblem && codingProblem.contest &&  (new Date(codingProblem.contest.startTime).getTime() > Date.now())){
      codingProblem.description = "";
    } 
    return codingProblem;
  } catch (error) {
    //console.log(error);
    throw error;
  }
};

export type GetProblemsParam = {
  category: string | null;
  startDif: number | null;
  endDif: number | null;
  tagList: Array<string>;
  page: number | null;
  q: string | null;
  init: boolean | undefined;
};

export const getCodingProblems = async (params: GetProblemsParam) => {
  try {
    //const params : GetProblemsParam = req.body;

    const { category, startDif, endDif, tagList, page, q ,init} = params;

    const pageNum = page == undefined ? 1 : Number(page);

    const skip = (pageNum - 1) * 20;

    let tags: Array<string> = [];

    if (tagList != undefined)
      tags = tagList.map((item: string) => (item));

    //console.log(tags);
    const filter = {
      categoryId:
        category != undefined && category != null
          ? Number(category)
          : undefined,
      difficulty: {
        lte: endDif != undefined && endDif != null ? Number(endDif) : undefined,
        gte:
          startDif != undefined && startDif != null
            ? Number(startDif)
            : undefined
      },
      codeforcesTag: tags.length>0? {
        some: {
          codeforcesTagId :{
            in : tags
          }
        }
      }:undefined
    };
    const problems:any = await prisma.codingProblem.findMany({
      skip: skip,
      take: 20,
      select: {
        id: true,
        title: true,
        category: {
          select: {
            name: true
          }
        },
        codeforcesTag: {
          select: {
            codeforcesTagId: true,
          }
        },
        difficulty: true,
        practicePoint: true,
        acceptedNumber: true,
        submissionNumber: true
      },
      where: filter,
      orderBy: {
        id: 'desc',
      }
    });

    const total = await prisma.codingProblem.count({
      where: filter
    });
    let categoriesAndTags = undefined;
  
    if(init) {
      categoriesAndTags = await getCategoriesAndTags();
    }
  
    for(let i=0;i<problems.length;i++) {
      problems[i].codeforcesTag = problems[i].codeforcesTag.map((item:any) => item.codeforcesTagId);
    }
    const totalPage = Math.floor(total / 20) + (total % 20 == 0 ? 0 : 1);

    return {
      problems: problems,
      totalPage: totalPage,
      total: total,
      categoriesAndTags: categoriesAndTags,
    };
  } catch (error) {
    throw error;
  }
};

export const getCategoriesAndTags = async () => {
  try {
    const categories = await prisma.codingProblemCategory.findMany();
    const tags = await prisma.codeforcesTag.findMany();
    return {
      categories: categories,
      tags: tags
    };
  } catch (error) {
    throw error;
  }
};

export const getCodeForcesTagList = async()=>{
  try {
    const lst= await prisma.codeforcesTag.findMany({
      select: {
        id: true,
      }
    });
    return lst.map(item=> item.id);

  }
  catch(error){
    throw error;
  }
}
export type GetRelatedProblemParam = {
  codeforcesTags : Array<string>;
  difficulty: number;  
}

export const getRelatedProblem = async (param: GetRelatedProblemParam) =>{
  try {
    
    const problems = await prisma.codingProblem.findMany({
      where : {
        codeforcesTag: {
          some : {
            codeforcesTagId: {
              in : param.codeforcesTags,
            }
          }
        },
        difficulty : {
          gte : param.difficulty - 300,
          lte : param.difficulty + 300,
        }
      },
      select: {
        id: true,
        title: true,
        difficulty: true, 
        practicePoint: true,
        visibleFrom: true,
        codeforcesTag: {
          select: {
            codeforcesTagId: true,
          }
        } 
      }
    });   
    return problems;
  }catch(error){
    throw error;
  }
}
const calLevel = (level: number) =>{
  
  switch(level) {
    case 1:
      return [800,1300];
    case 2:
      return [1000, 1500];
    case 3:
      return [1400, 2000];
    case 4:
      return [1800, 2400];
    case 5: 
      return [2300, 2900];
    case 6:
      return [2600, 3500];
  
  }
  return [800,3500];
}

export const getRecommendProblemSet = async (username: string, problemCnt : number, level: number)=>{
  try {
    
    const subs = await prisma.submission.findMany({
      where: {
        username: username,
      },
      select: {
        problemId: true,
      }
    });
    
    const problemIds = subs.map(item=> item.problemId);
    const difRange = calLevel(level);

    const filter = {
      difficulty: {
        lte : difRange[1],
        gte: difRange[0],
      },
      id: {
        notIn: problemIds,
      }
    }
    
    const total = await  prisma.codingProblem.count({
      where: filter,
    });

    const setCnt = Math.round(total/problemCnt);
    
    const ind = Math.round(Math.random() *100) % setCnt;

    const problems = await prisma.codingProblem.findMany({
      take: problemCnt,
      skip: ind * problemCnt,
      where :filter,
      select: {
        id: true,
        title: true,
        submissionNumber: true,
        acceptedNumber:true,
        difficulty:true,
        codeforcesTag: {
          select: {
            codeforcesTagId:true,
          }
        }
      }
    });
    return problems;
  }
  catch(error){
    throw error;
  }
}

type CreateCodingProblem = {
  name : string;
  time_limit: number;
  memory_limit : number;
  description: string;
  points: number;
  testcases: string;
  points_loss_per_min: number;
  // adding cai gidun:
  order_in_contest: string; //A,B,C..
  id: string ;
}


export const createProblems = async(problems : Array<CreateCodingProblem>, contestId: string | null, visibleFrom: number)=> {
  try{
    console.log(`create problems for contest ${contestId}`);

    const problemInfos : Array<any> = problems.map(prob=>({
      id: contestId?contestId+prob.order_in_contest:prob.id,
      timeLimit: prob.time_limit,
      categoryId: 2,
      title: prob.name,
      description: prob.description,
      difficulty: 0,
      memoryLimit: prob.memory_limit,
      link: null,
      visibleFrom: new Date(visibleFrom),
      totalPoint: prob.points,
      contestId: contestId,
      code: uuid(),
      acceptedNumber: 0,
      practicePoint: 100,
      submissionNumber: 0,
    }));    
    
    await prisma.codingProblem.createMany({
      data: problemInfos 
    });

    problems.forEach(prob=>{
      writeTestcase(prob.testcases,  contestId?(contestId+prob.order_in_contest):prob.id);
    });
    console.log('Add Problem and Test case successed!!!');
      
  }catch(error){
    console.log(error);
    throw new CustomAPIError("",400);
  } 
}