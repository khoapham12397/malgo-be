import { PrismaClient } from '@prisma/client';
import { threadId } from 'worker_threads';
import { addThreadToElastic } from '../elasticsearch/searchService';
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
  params: CreateThreadParam,
  username: string
) => {
  try {
    const summary =
      params.summary === null ? createSummary(params.content) : params.summary;

    let tags: Array<any> = [];

    for (let i = 0; i < params.tags.length; i++) {
      const item = {
        tag: { connect: { id: params.tags[i] } }
      };
      tags.push(item);
    }
    const user = await prisma.user.findUnique({
      where: {
        username: username
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
            id: Number(params.categoryId)
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
    

    addThreadToElastic({
      authorId: username,
      content: params.content,
      id : thread.id,
      title: params.title,
    });

    return thread;
  } catch (error) {
    console.log(error);
    return null;
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


type GetThreadResponse = {
  thread: Thread;
  totalRootCmt: number;
};
// category: string, type: string, page: number | undefined

type GetThreadListRes = {
  threads: Array<Thread>;
  totalPage: number;
  page: number;
  itemPerPage: number;
  totalThreads: number;
};

export const getThreadList = async (
  params: any,
  username: string | undefined
) => {
  try {
    let { category, type, page } = params;
    const itemPerPage = 4;

    if (typeof type != 'string') type = 'latest';
    if (typeof page != 'string') page = '1';
    page = Number(page)===0?1:Number(page);
  
    const cate = Number(category) == 0? undefined : { categoryId: Number(category)};
    console.log(category);
        
    const totalThread = await prisma.thread.count({
      where: cate,
    });
    
    let order;
    if (type == 'top')
      order = {
        totalComments: 'desc'
      };
    else
      order = {
        id: type == 'latest' ? 'desc' : 'asc'
      };

    const threadList = await prisma.thread.findMany({
      skip: (page- 1) * itemPerPage,
      take: itemPerPage,
      where: cate,
      include: {
        tags: true,
        category: {
          select: {
            id: true,
            parentId: true,
            title: true
          }
        },
      },
      orderBy: order as any
    });
    
    /*
    const likeList:Array<boolean> = [];
    
    if(username) {
      for(let i=0;i<threadList.length;i++) {
        const like = await prisma.userLikeThread.findUnique({
          where :{
            username_threadId :{
              username: username,
              threadId: threadList[i].id,
            }
          },
          select:{
            disable : true,
          }
        });
        if(!like) likeList.push(false);
        else if(like.disable) likeList.push(false);
        else likeList.push(true); 
      }
    }
    */
    const threads: Array<Thread> = threadList.map(
      (thread,index) =>
        ({
          id: thread.id,
          content: thread.content,
          author: {
            username: thread.authorId,
            avatar: ''
          },
          createdAt: thread.createdAt.getTime(),
          likes: thread.likes,
          isLike: false,
            
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
      itemPerPage: itemPerPage,
      threads: threads,
      totalPage:
        Math.floor(totalThread / itemPerPage) +
        (totalThread % itemPerPage == 0 ? 0 : 1),
      totalThreads: totalThread
    };
    return resultData;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getThread = async (
  threadId: string,
  username: string | undefined
) => {
  try {
    const startTime = Date.now();
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
    console.log(Date.now() - startTime);
    if (thread) {
      const likeThread =
        username != null
          ? await prisma.userLikeThread.findUnique({
              where: {
                username_threadId: { username: username, threadId: threadId }
              }
            })
          : null;

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
      return responseData;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
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
  params: any,
  username: string | undefined
) => {
  try {
    const { threadId, orderType, skip } = params;

    console.log('threadId:' + threadId);
    const comments = await prisma.comment.findMany({
      take: 10,
      skip: Number(skip),
      include: {
        usersLiked:
          username != undefined
            ? {
                where: {
                  username: username
                }
              }
            : false
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
              username != undefined
                ? item.usersLiked.length > 0 &&
                  item.usersLiked[0].disable == false
                : false
          } as CommentData,
          orderType: Number(orderType),
          totalChildCmt: item.totalChildren
        } as RootCommentRes)
    );

    return { comments: lst };
  } catch (error) {
    console.log(error);
    return [];
  }
};

type ChildComment = {
  commentData: CommentData;
  isFetched: boolean;
};

type ChildCommentsRes = {
  comments: Array<ChildComment>;
  rootCmtId: string;
};

export const getChildComments = async (
  params: any,
  username: string | undefined
) => {
  try {
    const { rootCmtId, skip, take } = params;
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
        usersLiked:
          username != undefined
            ? {
                where: {
                  username: username
                }
              }
            : false
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
              username != undefined
                ? item.usersLiked.length > 0 &&
                  item.usersLiked[0].disable == false
                : false
          } as CommentData,
          isFetched: true
        } as ChildComment)
    );

    return { comments: comments, rootCmtId: rootCmtId };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export type AddCommentParam = {
  content: string;
  threadId: string;
  parentId: string;
  rootId: string;
  parentCreator: string;
};

export const addComment = async (params: AddCommentParam, username: string) => {
  try {
    prisma.$transaction(async tx => {
      //const params:AddCommentParam = req.body;
      const cmtId = generateCommentId();

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
      //res.status(201).json({successed: true, data: {comment: comment}}).end();// dng;
      return { comment: comment };
    });
  } catch (error) {
    console.log(error);
    //res.sendStatus(400).end();
    throw error;
  }
};

export const likeThread = async (threadId: string, username: string) => {
  try {
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
    return true;
    //res.status(200).json({successed: true}).end();
  } catch (error) {
    console.log(error);
    throw error;
    //res.sendStatus(400).json({successed:false,msg: error}).end();
  }
};

export const likeComment = async (commentId: string, username: string) => {
  try {
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
    //res.status(200).json({successed: true}).end();
    return true;
  } catch (error) {
    console.log(error);
    //res.sendStatus(400).json({successed:false,msg: error}).end();
    throw error;
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

export const getCategoriesAndTags = async () => {
  try {
    const categories = await prisma.threadCategory.findMany();
    const tags = await prisma.threadTag.findMany();
    /*
        return res.status(200).json({
            successed: true, data: {
                categories: categories,
                tags: tags,
            }
        }).end();
        */
    return { categories: categories, tags: tags };
  } catch (error) {
    throw error;
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
  params: EditThreadParams,
  username: string
) => {
  try {
    console.log('vao edit thread');

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
      //return res.status(400).json({successed: false}).end();
      return null;
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
    //return res.status(200).json({successed:true, data : params});
    return params;
  } catch (error) {
    //console.log(error);
    throw error;
    //return res.status(400).json({successed:false}).end();
  }
};

export const getAllThreadsContent = async () =>{
  try{
    const threads = await prisma.thread.findMany({
      select: {
        id: true,
        content: true,
      }
    });
    return threads;
  }
  catch(error){
    console.log(error);
    throw error;
  }
}
