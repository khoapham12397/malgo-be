import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProblem = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;

    const codingProblem = await prisma.codingProblem.findUnique({
      where: {
        id: problemId
      },
      include: {
        authors: {
          select: {
            username: true
          }
        },
        tags: {
          select: {
            tagId: true
          }
        }
      }
    });

    if (!codingProblem) {
      return res
        .status(404)
        .json({ successed: false, message: 'Problem not found' });
    }

    return res
      .status(200)
      .json({
        successed: true,
        data: codingProblem
      })
      .end();
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({
        successed: false,
        message: error
      })
      .end();
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

export const getCodingProblems = async (req: Request, res: Response) => {
  try {
    const params: GetProblemsParam = req.body;
    console.log('params: ');
    console.log(params);
    // cai nay la dung okdung:
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
      tags: {
        some: {
          tagId: {
            in: tags.length > 0 ? tags : undefined
          }
        }
      }
    };
    console.log(filter);
    const problems = await prisma.codingProblem.findMany({
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
        difficulty: true,
        practicePoint: true,
        acceptedNumber: true,
        submissionNumber: true
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
          : undefined
    });
    console.log(problems);

    const total = await prisma.codingProblem.count({
      where: filter
    });
    const totalPage = Math.floor(total / 20) + (total % 20 == 0 ? 0 : 1);

    return res
      .status(200)
      .json({
        successed: true,
        data: {
          problems: problems,
          totalPage: totalPage,
          total: total
        }
      })
      .end();
  } catch (err) {
    console.log(err);
    return res.sendStatus(400).end();
  }
};

export const getProblems = async (req: Request, res: Response) => {
  // category startDiff, endDiff , tags ,page, q = ?
  try {
    const { category, startDif, endDif, type, page, q } = req.query;
    const pageNum = page == undefined ? 1 : Number(page);
    const skip = (Number(pageNum) - 1) * 20;
    let tags: Array<number> = [];
    if (q != undefined) {
      console.log('query str:' + (q as string));
    }

    if (type != undefined) {
      if (typeof type == 'object') {
        const lst = Object.values(type);
        lst.map(x => tags.push(Number(x)));
      } else tags.push(Number(type));
    }

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
      tags: {
        some: {
          tagId: {
            in: tags.length > 0 ? tags : undefined
          }
        }
      }
    };
    console.log(filter);
    const result = await prisma.codingProblem.findMany({
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
        difficulty: true,
        practicePoint: true,
        acceptedNumber: true,
        submissionNumber: true
      },
      where: filter,
      orderBy:
        q != undefined && q != null
          ? ({
              _relevance: {
                fields: ['title'],
                search: q as string,
                sort: 'desc'
              }
            } as any)
          : undefined
    });

    return res.status(200).json({ successed: true, data: result }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400).end();
  }
};

export const getCategoryList = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.codingProblemCategory.findMany();
    res
      .status(200)
      .json({ successed: true, data: { categories: categories } })
      .end();
  } catch (err) {
    console.log(err);
    res.sendStatus(400).end();
  }
};
export const getTagList = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.codingProblemTag.findMany();
    res
      .status(200)
      .json({ successed: true, data: { tags: tags } })
      .end();
  } catch (err) {
    console.log(err);
    res.sendStatus(400).end();
  }
};

export const getCategoriesAndTags = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.codingProblemCategory.findMany();
    const tags = await prisma.codingProblemTag.findMany();

    res
      .status(200)
      .json({
        successed: true,
        data: {
          categories: categories,
          tags: tags
        }
      })
      .end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
};
