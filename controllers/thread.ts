import { PrismaClient } from '@prisma/client';
import express from 'express';
//import thread from "src/routes/thread";
//import prisma from "../db";
import { generateCommentId, generateThreadId } from '../utils/genId';

const prisma = new PrismaClient();

type CreateThreadParam = {
  title: string;
  content: string;
  categoryId: number | number;
  tags: Array<string>;
  published: boolean;
  summary: string;
};

const createSummary = (content: string): string => {
  return '';
};

export const createThread = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const params: CreateThreadParam = req.body;
    const summary =
      params.summary === null ? createSummary(params.content) : params.summary;
    const username = getUsername(req);
    let tags: Array<any> = [];

    for (let i = 0; i < params.tags.length; i++) {
      const item = {
        tag: { connect: { id: params.tags[i] } }
      };
      tags.push(item);
    }
    const user = await prisma.user.findUnique({
      where: {
        username: 'test1'
      }
    });
    console.log(user);

    const thread = await prisma.thread.create({
      data: {
        content: params.content,
        published: params.published,
        id: generateThreadId(),
        summary: summary,
        title: params.title,

        category: {
          connect: {
            id: 2
          }
        },
        author: {
          connect: {
            username: username
          }
        },

        tags: {
          create: tags
        }
      }
    });

    res.status(201).json({ successed: true });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

type Thread = {
  id: string;

  author: {
    username: string;
    avatar: string;
  };
  title: string;
  summary: string;
  createdAt: number;
  views: number;
  likes: number;
  totalComments: number;
  content: string;
  isLike: boolean;
  category: ThreadCategory | null;
  tags: Array<string>;
};

type ThreadCategory = {
  id: number | string;
  title: string;
  parentId: string | null;
};

// adding 2 element vao la duoc dung:

type GetThreadResponse = {
  thread: Thread;
  totalRootCmt: number;
};
// category: string, type: string, page: number | undefined
type GetThreadListRes = {
  threads: Array<Thread>;
  totalPage: number;
  page: number;
  pageCount: number;
  totalThreads: number;
};
const getUsername = (req: express.Request): string => {
  return 'test1';
};

export const getThreadList = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    let { category, type, page } = req.query;
    const username = getUsername(req);
    if (typeof type != 'string') type = 'latest'; // dg:
    if (typeof page != 'string') page = '1';

    const cate = Number(category) == 0 ? {} : { categoryId: Number(category) };
    console.log(cate);
    const x = await prisma.thread.findMany({
      where: cate,
      select: {
        _count: true
      }
    });
    const totalThread = x.length;

    const threadList = await prisma.thread.findMany({
      skip: (Number(page) - 1) * 10,
      take: 10,
      where: cate,
      include: {
        author: {
          select: { username: true }
        },
        userLikes: {
          where: {
            username: username
          }
        },
        tags: true,
        category: {
          select: {
            id: true,
            parentId: true,
            title: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    const threads: Array<Thread> = threadList.map(
      thread =>
        ({
          id: thread.id,
          content: thread.content,
          author: {
            username: thread.author.username,
            avatar: ''
          },
          createdAt: thread.createdAt.getTime(),
          likes: thread.likes,
          isLike:
            thread.userLikes.length > 0 ? !thread.userLikes[0].disable : false,
          summary: thread.summary,
          title: thread.title,
          totalComments: thread.totalComments,
          views: thread.views,
          tags: thread.tags.map(item => item.tagId),
          category: thread.category
        } as Thread)
    );

    const resultData: GetThreadListRes = {
      page: Number(page),
      pageCount: 10,
      threads: threads,
      totalPage: Math.floor(totalThread / 10) + (totalThread % 10 == 0 ? 0 : 1),
      totalThreads: totalThread
    };
    res.status(200).json({ successed: true, data: resultData });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ msg: error });
  }
};

export const getThread = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { threadId } = req.params;
    let username = getUsername(req);

    const thread = await prisma.thread.findUnique({
      where: {
        id: threadId
      },
      include: {
        author: {
          select: {
            username: true
          }
        },
        tags: true,
        category: {
          select: {
            id: true,
            parentId: true,
            title: true
          }
        }
      }
    });

    if (thread) {
      const likeThread = await prisma.userLikeThread.findUnique({
        where: {
          username_threadId: { username: username, threadId: threadId }
        }
      });
      const threadData: Thread = {
        id: thread.id,
        content: thread.content,
        author: {
          username: thread.author.username,
          avatar: ''
        },
        createdAt: thread.createdAt.getTime(),
        likes: thread.likes,
        isLike: likeThread != null ? !likeThread.disable : false,
        summary: thread.summary,
        title: thread.title,
        totalComments: thread.totalComments,
        views: thread.views,
        tags: thread.tags.map(item => item.tagId),
        category: thread.category
      };
      const responseData: GetThreadResponse = {
        thread: threadData,
        totalRootCmt: thread.totalRootComments
      };
      res.status(200).json({ successed: true, data: responseData });
    } else {
      res.status(404).json({ successed: false, msg: 'Thread not found' }).end();
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
type CommentData = {
  id: string;
  threadId: string;
  creator: string; //username
  createdAt: number;
  content: string;
  vote: number;
  isLike: boolean;
  likes: number;
  parent: {
    id: string;
    author: string;
  };
  rootId: string;
};

type GetRootCommentsReq = {
  threadId: string;
  orderType: number;
  skip: number;
};

type RootCommentRes = {
  data: CommentData;
  totalChildCmt: number;
  orderType: number;
};

export const getRootComments = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { threadId, orderType, skip } = req.query;
    const username = getUsername(req);

    console.log('threadId:' + threadId);
    const comments = await prisma.comment.findMany({
      skip: Number(skip),
      include: {
        usersLiked: {
          where: {
            username: username
          }
        }
      },
      where: {
        threadId: typeof threadId != 'string' ? '' : threadId,
        parentId: null
      },

      orderBy: {
        id: orderType == '0' ? 'asc' : 'desc'
      }
    });

    const lst = comments.map(
      item =>
        ({
          data: {
            content: item.content,
            createdAt: item.createdAt.getDate(),
            creator: item.creatorId,
            id: item.id,
            likes: item.likes,
            parent: {
              id: item.parentId,
              author: item.parentUsername
            },
            rootId: item.rootId,
            threadId: item.threadId,
            vote: 0,
            isLike:
              item.usersLiked.length > 0 && item.usersLiked[0].disable == false
          } as CommentData,
          orderType: Number(orderType),
          totalChildCmt: item.totalChildren
        } as RootCommentRes)
    );

    res.status(200).json({ successed: true, data: { comments: lst } });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
};

// rootCmtId:
// rootCmtId: string, currentSize : number// dung cai nay load by time la duocd:

type ChildComment = {
  commentData: CommentData;
  isFetched: boolean;
};

type ChildCommentsRes = {
  comments: Array<ChildComment>;
  rootCmtId: string;
};

export const getChildComments = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { rootCmtId, skip, take } = req.query;
    const username = getUsername(req);

    if (typeof rootCmtId != 'string') {
      throw Error('bad request');
    }

    const commentList = await prisma.comment.findMany({
      skip: Number(skip),
      take: Number(take),
      where: {
        rootId: rootCmtId,
        parentId: {
          not: null
        }
      },
      include: {
        usersLiked: {
          where: {
            username: username
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    const comments = commentList.map(
      item =>
        ({
          commentData: {
            content: item.content,
            createdAt: item.createdAt.getDate(),
            creator: item.creatorId,
            id: item.id,
            likes: item.likes,
            parent: {
              id: item.parentId,
              author: item.parentUsername
            },
            rootId: item.rootId,
            threadId: item.threadId,
            vote: 0,
            isLike:
              item.usersLiked.length > 0 && item.usersLiked[0].disable == false
          } as CommentData,
          isFetched: true
        } as ChildComment)
    );

    res.status(200).json({
      successed: true,
      data: {
        comments: comments,
        rootCmtId: rootCmtId
      }
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
};

export type AddCommentParam = {
  content: string;
  threadId: string;
  parentId: string;
  rootId: string;
  parentCreator: string;
};

export const addComment = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    prisma.$transaction(async tx => {
      const params: AddCommentParam = req.body;
      const cmtId = generateCommentId();
      const username = getUsername(req);
      let depth = 0;

      if (params.parentId != null) {
        const parentCmt = await prisma.comment.findUnique({
          where: { id: params.parentId },
          select: {
            depth: true
          }
        });

        if (parentCmt) {
          depth = parentCmt.depth + 1;
        }
        await prisma.comment.update({
          where: { id: params.rootId },
          data: {
            totalChildren: {
              increment: 1
            }
          }
        });
      }

      const cmt = await prisma.comment.create({
        data: {
          content: params.content,
          id: cmtId,
          parentId: params.parentId,
          parentUsername: params.parentCreator,
          rootId: params.rootId == null ? cmtId : params.rootId,
          threadId: params.threadId,
          creatorId: username,
          depth: depth,
          totalChildren: 0
        }
      });
      await prisma.thread.update({
        where: { id: params.threadId },
        data: {
          totalComments: {
            increment: 1
          },
          totalRootComments: {
            increment: params.parentId == null ? 1 : 0
          }
        }
      });
      const comment: CommentData = {
        content: cmt.content,
        createdAt: cmt.createdAt.getDate(),
        creator: cmt.creatorId,
        id: cmt.id,
        likes: cmt.likes,
        parent: {
          id: cmt.parentId ? cmt.parentId : '',
          author: cmt.parentUsername ? cmt.parentUsername : ''
        },
        rootId: cmt.rootId,
        threadId: cmt.threadId,
        vote: 0,
        isLike: false
      };
      res
        .status(201)
        .json({ successed: true, data: { comment: comment } })
        .end(); // dng;
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).end();
  }
};

export const likeThread = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { threadId } = req.query;
    if (typeof threadId != 'string') {
      throw Error('Invalid Thread ID');
    }
    const username = getUsername(req);
    const likeItem = await prisma.userLikeThread.findUnique({
      where: {
        username_threadId: { username: username, threadId: threadId }
      }
    });

    if (likeItem) {
      await prisma.userLikeThread.update({
        where: {
          username_threadId: { username: username, threadId: threadId }
        },
        data: {
          disable: !likeItem.disable
        }
      });
    } else {
      await prisma.userLikeThread.create({
        data: {
          threadId: threadId,
          username: username
        }
      });
    }
    await changeLikesThread(threadId, likeItem ? likeItem.disable : true);

    res.status(200).json({ successed: true }).end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ successed: false, msg: error }).end();
  }
};

export const likeComment = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    // check coi co dung lodg:

    const { commentId } = req.query;
    if (typeof commentId != 'string') throw Error('Invalid comment id');
    const username = getUsername(req);
    const likeCmt = await prisma.userLikeComment.findUnique({
      where: {
        username_commentId: { username: username, commentId: commentId }
      }
    });

    if (likeCmt) {
      await prisma.userLikeComment.update({
        where: {
          username_commentId: { username: username, commentId: commentId }
        },
        data: {
          disable: !likeCmt.disable
        }
      });
    } else {
      await prisma.userLikeComment.create({
        data: {
          commentId: commentId,
          username: username
        }
      });
    }
    await changeLikesComment(commentId, likeCmt ? likeCmt.disable : true);
    res.status(200).json({ successed: true }).end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ successed: false, msg: error }).end();
  }
};

const changeLikesThread = async (threadId: string, inc: boolean) => {
  const updateData = inc
    ? { likes: { increment: 1 } }
    : { likes: { decrement: 1 } };
  await prisma.thread.update({
    where: { id: threadId },
    data: updateData
  });
};

const changeLikesComment = async (commentId: string, inc: boolean) => {
  const updateData = inc
    ? { likes: { increment: 1 } }
    : { likes: { decrement: 1 } };
  await prisma.comment.update({
    where: { id: commentId },
    data: updateData
  });
};

const changeTotalComments = (threadId: string, inc: boolean) => {};

export const getCategoriesAndTags = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const categories = await prisma.threadCategory.findMany();
    const tags = await prisma.threadTag.findMany();
    return res
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
    return res.status(400).json().end();
  }
};
type EditThreadParams = {
  id: string;
  content: string;
  title: string;
  tags: Array<string>;
  category: string;
};

export const editThread = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    console.log('vao edit thread');
    const params: EditThreadParams = req.body;
    const username = getUsername(req);

    const thrd = await prisma.thread.findUnique({
      where: { id: params.id },
      select: {
        authorId: true,
        tags: {
          select: {
            tagId: true
          }
        }
      }
    });

    if (thrd == null || thrd.authorId != username) {
      return res.status(400).json({ successed: false }).end();
    }
    const tagList: Array<any> = [],
      rmTagList: Array<any> = [];
    const tags = thrd.tags.map(item => item.tagId);

    for (let i = 0; i < params.tags.length; i++) {
      if (!tags.includes(params.tags[i])) {
        const item = {
          tag: { connect: { id: params.tags[i] } }
        };
        tagList.push(item);
      }
    }

    for (let i = 0; i < tags.length; i++) {
      if (!params.tags.includes(tags[i])) {
        rmTagList.push({
          threadId_tagId: {
            tagId: tags[i],
            threadId: params.id
          }
        });
      }
    }

    console.log('category: ' + params.category);
    const thread = await prisma.thread.update({
      where: { id: params.id },
      data: {
        title: params.title,
        content: params.content,
        tags: {
          create: tagList,
          delete: rmTagList
        },
        categoryId: Number(params.category)
      }
    });
    return res.status(200).json({ successed: true, data: params });
  } catch (error) {
    return res.status(400).json({ successed: false }).end();
  }
};
