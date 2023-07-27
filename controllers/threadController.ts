import { PrismaClient } from "@prisma/client";
import express from "express";
import CustomAPIError from "../config/CustomAPIError";
import { searchSimilarThread } from "../elasticsearch/searchService";
import {
  createThread,
  editThread,
  getCategoriesAndTags,
  getChildComments,
  getRootComments,
  getThread,
  getThreadList,
  likeComment,
  likeThread,
} from "../services/threadService";
import { getUsername } from "../utils/checkUser";

import { generateCommentId, generateThreadId } from "../utils/genId";

const prisma = new PrismaClient();

type CreateThreadParam = {
  title: string;
  content: string;
  categoryId: number | number;
  tags: Array<string>;
  published: boolean;
  summary: string;
  username: string;
};

const createSummary = (content: string): string => {
  return "";
};

export const createThreadCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const params: CreateThreadParam = req.body;

    const result = await createThread(params, params.username);
    res.status(201).json({ successed: true, result });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ successed: false });
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
  pageCount: number;
  totalThreads: number;
};

export const getThreadListCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    //let {category, type, page ,username} = req.query;
    const username = getUsername(req, req.query.username as string);
    const resultData = await getThreadList(req.query, username);

    res.status(200).json({ successed: true, data: resultData });
  } catch (error: any) {
    console.log(error);
    res.sendStatus(400).json({ msg: error.message });
  }
};

export const getThreadCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { threadId } = req.params;
    //let username = getUsername(req);
    const responseData = await getThread(
      threadId,
      req.query.username as string | undefined
    );

    if (responseData != null) {
      res.status(200).json({ successed: true, data: responseData });
    } else
      res.status(404).json({ successed: false, message: "thread not found" });
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

export const getRootCommentsCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { threadId, orderType, skip } = req.query;
    //const username = getUsername(req);
    const result = await getRootComments(
      req.query,
      req.query.username as string | undefined
    );

    res.status(200).json({ successed: true, data: result });
  } catch (error) {
    //console.log(error);
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

export const getChildCommentsCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { rootCmtId, skip, take } = req.query;
    //const username = getUsername(req);

    if (typeof rootCmtId != "string") {
      throw Error("bad request");
    }
    const result = await getChildComments(
      req.query,
      req.query.username as string | undefined
    );

    res.status(200).json({
      successed: true,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ successed: false }).end();
  }
};

export type AddCommentParam = {
  content: string;
  threadId: string;
  parentId: string;
  rootId: string;
  parentCreator: string;
  username: string;
};

export const addCommentCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    prisma.$transaction(async (tx) => {
      const params: AddCommentParam = req.body;
      //console.log('add comment by username: ' + params.username);
      const cmtId = generateCommentId();
      //const username = getUsername(req);
      let depth = 0;

      if (params.parentId != null) {
        const parentCmt = await prisma.comment.findUnique({
          where: { id: params.parentId },
          select: {
            depth: true,
          },
        });
        if (parentCmt) {
          depth = parentCmt.depth + 1;
        }
        await prisma.comment.update({
          where: { id: params.rootId },
          data: {
            totalChildren: {
              increment: 1,
            },
          },
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
          creatorId: params.username,
          depth: depth,
          totalChildren: 0,
        },
      });
      await prisma.thread.update({
        where: { id: params.threadId },
        data: {
          totalComments: {
            increment: 1,
          },
          totalRootComments: {
            increment: params.parentId == null ? 1 : 0,
          },
        },
      });
      const comment: CommentData = {
        content: cmt.content,
        createdAt: cmt.createdAt.getDate(),
        creator: cmt.creatorId,
        id: cmt.id,
        likes: cmt.likes,
        parent: {
          id: cmt.parentId ? cmt.parentId : "",
          author: cmt.parentUsername ? cmt.parentUsername : "",
        },
        rootId: cmt.rootId,
        threadId: cmt.threadId,
        vote: 0,
        isLike: false,
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
type LikeThreadParams = {
  threadId: string;
  username: string;
};

export const likeThreadCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const params: LikeThreadParams = req.body;

    if (typeof params.threadId != "string") {
      throw Error("Invalid Thread ID");
    }
    //const username = getUsername(req);
    const result = await likeThread(params.threadId, params.username);

    if (result) res.status(200).json({ successed: true }).end();
    else res.status(400).json({ successed: false }).end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ successed: false, msg: error }).end();
  }
};
type LikeCommentParams = {
  commentId: string;
  username: string;
};

export const likeCommentCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const params: LikeCommentParams = req.body;

    if (typeof params.commentId != "string") throw Error("Invalid comment id");
    //const username = getUsername(req);
    const result = await likeComment(params.commentId, params.username);
    if (result) {
      res.status(200).json({ successed: true }).end();
    } else res.status(400).json({ successed: false }).end();
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({ successed: false, msg: error }).end();
  }
};

export const getCategoriesAndTagsCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const result = await getCategoriesAndTags();
    return res
      .status(200)
      .json({
        successed: true,
        data: result,
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
  username: string;
};

export const editThreadCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const params: EditThreadParams = req.body;
    const username = getUsername(req, "");
    if (!username) throw new CustomAPIError("Not Authenticated", 403);
    const result = await editThread(params, username);
    if (result) return res.status(200).json({ successed: true, data: params });
    return res.status(400).json({ successed: false }).end();
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const searchSimilarThreadCtl = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const threads = await searchSimilarThread(req.body.content);
    return res.status(200).json({
      successed: true,
      data: {
        threads: threads,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message })
      .end();
  }
};
