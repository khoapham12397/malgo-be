import { PrismaClient } from '@prisma/client';

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

    return codingProblem;
  } catch (error) {
    //console.log(error);
    throw error;
  }
};

type GetProblemsParam = {
  category: string | null;
  startDif: number | null;
  endDif: number | null;
  tagList: Array<string>;
  page: number | null;
  q: string | null;
};

export const getCodingProblems = async (params: GetProblemsParam) => {
  try {
    //const params : GetProblemsParam = req.body;

    const { category, startDif, endDif, tagList, page, q } = params;

    const pageNum = page == undefined ? 1 : Number(page);

    const skip = (pageNum - 1) * 20;

    let tags: Array<number> = [];

    if (tagList != undefined)
      tags = tagList.map((item: string) => Number(item));

    console.log(tags);
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
      tags: tags.length>0? {
        some: {
          tagId: {
            in: tags,
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

    for(let i=0;i<problems.length;i++) {
      problems[i].codeforcesTag = problems[i].codeforcesTag.map((item:any) => item.codeforcesTagId);
    }
    const totalPage = Math.floor(total / 20) + (total % 20 == 0 ? 0 : 1);

    return {
      problems: problems,
      totalPage: totalPage,
      total: total
    };
  } catch (error) {
    throw error;
  }
};

export const getCategoriesAndTags = async () => {
  try {
    const categories = await prisma.codingProblemCategory.findMany();
    const tags = await prisma.codingProblemTag.findMany();
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

