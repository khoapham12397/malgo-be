import { PrismaClient } from '@prisma/client';
import { uuid } from 'short-uuid';
import {
  CreateMathNoteParam,
  CreateMathProbSetParam,
  EditMathNoteParam,
  EditMathProbParam,
  GetMathNoteParam
} from '../controllers/mathProblemController';
const prisma = new PrismaClient();

export const getProblem = async (
  problemId: string,
  username: string | null
) => {
  try {
    const problem = await prisma.mathProblem.findUnique({
      where: {
        id: problemId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        authors: {
          select: {
            username: true
          }
        },
        tags: {
          select: {
            tagId: true
          }
        },
        problemSet: {
          select: {
            mathProbSet: {
              select: {
                id: true,
                title: true,
                creatorId: true,
                numberProb: true
              }
            },
            order: true
          }
        }
      }
    });
    if (problem) {
      problem.prevProblems = problem.prevProblems
        ? JSON.parse(problem.prevProblems)
        : [];
      problem.nextProblems = problem.nextProblems
        ? JSON.parse(problem.nextProblems)
        : [];
    } else throw Error('Problem not found');

    if (username) {
      const id = {
        creatorId: username,
        mathProblemId: problemId
      };

      const mathNote = await prisma.mathNote.findUnique({
        where: {
          mathProblemId_creatorId: id
        }
      });
      if (mathNote && mathNote.imageLink)
        mathNote.imageLink = JSON.parse(mathNote.imageLink);

      const mathSolution = await prisma.mathSolution.findUnique({
        where: {
          mathProblemId_creatorId: id
        }
      });
      if (mathSolution && mathSolution.imageLink)
        mathSolution.imageLink = JSON.parse(mathSolution.imageLink);

      return {
        mathProblem: problem,
        mathNote: mathNote,
        mathSolution: mathSolution
      };
    }
    return { mathProblem: problem, mathNote: null, mathSolution: null };
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

export const getMathProblems = async (params: GetProblemsParam) => {
  try {
    //const params : GetProblemsParam = req.body;
    const itemPerPage = 10;

    const { category, startDif, endDif, tagList, page, q } = params;

    const pageNum = page == undefined ? 1 : Number(page);

    const skip = (pageNum - 1) * itemPerPage;

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
      tags:
        tags.length > 0
          ? {
              some: {
                tagId: {
                  in: tags
                }
              }
            }
          : undefined
    };

    const startTime = Date.now();

    const problems = await prisma.mathProblem.findMany({
      skip: skip,
      take: itemPerPage,
      select: {
        id: true,
        title: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        difficulty: true,
        practicePoint: true,
        description: true
      },
      where: filter,
      orderBy:
        q != undefined
          ? ({
              _relevance: {
                fields: ['title'],
                search: q as string,
                sort: 'desc'
              }
            } as any)
          : {
              id: 'desc'
            }
    });
    console.log(problems);

    const total = await prisma.mathProblem.count({
      where: filter
    });
    console.log(Date.now() - startTime);
    const totalPage =
      Math.floor(total / itemPerPage) + (total % itemPerPage == 0 ? 0 : 1);

    return {
      problems: problems,
      totalPage: totalPage,
      total: total,
      itemPerPage: itemPerPage
    };
  } catch (error) {
    throw error;
  }
};

export const getCategoriesAndTags = async () => {
  try {
    const categories = await prisma.mathProblemCategory.findMany();
    const tags = await prisma.mathProblemTag.findMany();
    return {
      categories: categories,
      tags: tags
    };
  } catch (error) {
    throw error;
  }
};
type CreateMathProblemParam = {
  title: string;
  description: string;
  categoryId: number | string;
  tags: Array<string>;
  difficulty: number;
  username: string | undefined;
  hint: string | undefined;
};

export const createMathProblem = async (params: CreateMathProblemParam) => {
  try {
    let tagList: Array<any> = [];
    if (params.tags) {
      for (let i = 0; i < params.tags.length; i++) {
        tagList.push({
          tag: {
            connect: {
              id: params.tags[i]
            }
          }
        });
      }
    }

    console.log(tagList);
    const problem = await prisma.mathProblem.create({
      data: {
        id: uuid(),
        description: params.description,
        categoryId: Number(params.categoryId),
        title: params.title,
        difficulty: params.difficulty,
        hint: params.hint,
        tags:
          tagList.length > 0
            ? {
                create: tagList
              }
            : undefined
      }
    });
    return problem;
  } catch (error) {
    throw error;
  }
};

export const createMathNote = async (
  params: CreateMathNoteParam,
  imageLink: string
) => {
  try {
    const note = await prisma.mathNote.create({
      data: {
        content: params.content,
        creatorId: params.username,
        mathProblemId: params.problemId,
        imageLink: imageLink
      }
    });
    if (note && note.imageLink) note.imageLink = JSON.parse(note.imageLink);

    let sol = null;
    if (params.addToSolution) {
      sol = await prisma.mathSolution.create({
        data: {
          content: params.content,
          creatorId: params.username,
          mathProblemId: params.problemId,
          imageLink: imageLink
        }
      });
      if (sol && sol.imageLink) sol.imageLink = JSON.parse(sol.imageLink);
    }

    return {
      note: note,
      solution: sol
    };
  } catch (error) {
    throw error;
  }
};

export const getMathNote = async (params: GetMathNoteParam) => {
  try {
    const note = await prisma.mathNote.findUnique({
      where: {
        mathProblemId_creatorId: {
          creatorId: params.username,
          mathProblemId: params.mathProblemId
        }
      }
    });
    if (note && note.imageLink) note.imageLink = JSON.parse(note.imageLink);
    return note;
  } catch (error) {
    throw error;
  }
};

export const editMathNote = async (
  params: EditMathNoteParam,
  imageLink: string
) => {
  try {
    const id = {
      mathProblemId_creatorId: {
        creatorId: params.username,
        mathProblemId: params.problemId
      }
    };
    console.log(params.username);
    console.log(params.problemId);

    const note = await prisma.mathNote.update({
      where: id,
      data: {
        content: params.content,
        imageLink: imageLink
      }
    });
    if (note.imageLink) note.imageLink = JSON.parse(note.imageLink);

    let newSol = null;
    if (params.addToSolution) {
      const oldSol = await prisma.mathSolution.findUnique({
        where: id
      });

      if (oldSol) {
        newSol = await prisma.mathSolution.update({
          where: id,
          data: {
            content: params.content,
            imageLink: imageLink
          }
        });
      } else
        newSol = await prisma.mathSolution.create({
          data: {
            content: params.content,
            creatorId: params.username,
            mathProblemId: params.problemId,
            imageLink: imageLink
          }
        });
      if (newSol.imageLink) newSol.imageLink = JSON.parse(newSol.imageLink);
    }

    return {
      note: note,
      solution: newSol
    };
  } catch (error) {
    throw error;
  }
};

export const getMathSolutions = async (problemId: string) => {
  try {
    const solutions = await prisma.mathSolution.findMany({
      where: {
        mathProblemId: problemId
      }
    });
    for (let i = 0; i < solutions.length; i++) {
      if (solutions[i].imageLink) {
        solutions[i].imageLink = JSON.parse(solutions[i].imageLink as string);
      }
    }
    return solutions;
  } catch (error) {
    throw error;
  }
};

const processProblemSet = (oldList: Array<any>, newList: Array<any>) => {
  let removeList: Array<any> = [];
  let updateList: Array<any> = [];

  oldList.forEach(item => {
    if (!newList.includes(item)) removeList.push(item);
    else updateList.push(item);
  });

  return {
    removeSetList: removeList,
    updateSetList: updateList
  };
};

export const editMathProblem = async (params: EditMathProbParam) => {
  try {
    console.log(params);
    //        const lst = [2];

    const tagList: Array<any> = params.tags.map(item => ({
      tagId: Number(item)
    }));

    const tags = params.tags.map(item => Number(item));

    const currentProb = await prisma.mathProblem.findUnique({
      where: {
        id: params.problemId
      },
      select: {
        tags: {
          select: {
            tagId: true
          }
        },
        problemSet: {
          select: {
            setId: true
          }
        }
      }
    });

    if (!currentProb) throw Error('Problem not found');

    const removeTagList: Array<any> = [];
    currentProb.tags.forEach(item => {
      if (!tags.includes(item.tagId))
        removeTagList.push({
          mathProblemId: params.problemId,
          tagId: item.tagId
        });
    });

    console.log(removeTagList);

    let oldSetList = currentProb.problemSet.map(item => item.setId);
    let newSetList = params.probSetList.map(item => item.setId);
    console.log('oldSetList');
    console.log(oldSetList);

    console.log('newSetList');
    console.log(newSetList);
    const { removeSetList, updateSetList } = processProblemSet(
      oldSetList,
      newSetList
    );
    console.log('removeSetList');
    console.log(removeSetList);

    console.log('updateSetList');
    console.log(updateSetList);

    const removeSetListFix: Array<any> = removeSetList.map(item => ({
      setId: item,
      problemId: params.problemId
    }));

    const updateSetListFix: Array<any> = [];
    const addSetListFix: Array<any> = [];

    params.probSetList.forEach(item => {
      if (updateSetList.includes(item.setId)) {
        updateSetListFix.push({
          data: {
            order: item.order
          },
          where: {
            setId_problemId: {
              problemId: params.problemId,
              setId: item.setId
            }
          }
        });
      } else addSetListFix.push({ setId: item.setId, order: item.order });
    });
    console.log('removeSetListFix');
    console.log(removeSetListFix);

    console.log('updateSetListFix');
    console.log(updateSetListFix);

    console.log('addSetListFix');
    console.log(addSetListFix);

    const startTime = Date.now();

    const mathProblem = await prisma.mathProblem.update({
      where: {
        id: params.problemId
      },
      data: {
        categoryId: Number(params.categoryId),
        description: params.description,
        difficulty: params.difficulty,
        hint: params.hint,
        tags: {
          createMany: {
            data: tagList,
            skipDuplicates: true
          },
          deleteMany: removeTagList
        },
        title: params.title,
        prevProblems: params.prevProblems,
        nextProblems: params.nextProblems,
        problemSet: {
          deleteMany: removeSetListFix,

          createMany: {
            data: addSetListFix,
            skipDuplicates: true
          }
        }
      }
    });

    if (addSetListFix.length > 0) {
      const lst: Array<string> = addSetListFix.map(item => item.setId);

      await prisma.mathProblemSet.updateMany({
        where: {
          id: { in: lst }
        },
        data: {
          numberProb: { increment: 1 }
        }
      });
    }
    if (removeSetList.length > 0) {
      await prisma.mathProblemSet.updateMany({
        where: {
          id: { in: removeSetList }
        },
        data: { numberProb: { decrement: 1 } }
      });
    }
    //
    console.log(Date.now() - startTime);

    mathProblem.prevProblems = mathProblem.prevProblems
      ? JSON.parse(mathProblem.prevProblems)
      : [];
    mathProblem.nextProblems = mathProblem.nextProblems
      ? JSON.parse(mathProblem.nextProblems)
      : [];
    return mathProblem;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createMathProbSet = async (params: CreateMathProbSetParam) => {
  try {
    const problemSet = await prisma.mathProblemSet.create({
      data: {
        id: uuid(),
        numberProb: params.problems.length,
        creatorId: params.username,
        title: params.title
      }
    });

    const relList: Array<any> = params.problems.map(item => ({
      problemId: item.problemId,
      setId: problemSet.id,
      order: item.order
    }));

    await prisma.mathSetProbRel.createMany({
      data: relList
    });
    return problemSet;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProblemSetList = async (
  page: number,
  username: string | undefined
) => {
  try {
    return await prisma.mathProblemSet.findMany({
      where: undefined
    });
  } catch (error) {
    throw error;
  }
};

export const getProblemSet = async (id: string) => {
  try {
    const ps = await prisma.mathProblemSet.findUnique({
      where: {
        id: id
      },
      include: {
        problems: {
          select: {
            problem: true,
            order: true
          }
        }
      }
    });
    return ps;
  } catch (error) {
    throw error;
  }
};
