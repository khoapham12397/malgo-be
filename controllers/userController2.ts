import { Request, Response } from "express";
import CustomAPIError from "../config/CustomAPIError";
import { setSeenMsgSessionP2P } from "../services/chatService";
import {
  acceptFriendReq,
  addUserToGroup,
  checkFriendShip,
  checkRelTwoUser,
  createFriendReq,
  createGroup,
  createPostGroup,
  findUserByEmail,
  getFriendList,
  getFriendReqFrom,
  getFriendReqTo,
  getGroupList,
  getGroupMember,
  getGroupPostList,
  getShareResource,
  lookedShare,
  shareResource,
} from "../services/userService2";
import { getUsername } from "../utils/checkUser";

export const getFriendListCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.params.username);

    if (username && username == req.params.username) {
      const friendList = await getFriendList(username);
      res.status(200).json({
        successed: true,
        data: {
          friendList: friendList,
        },
      });
    } else
      res.status(400).json({ successed: false, message: "user not found" });
  } catch (error: any) {
    res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message });
  }
};

export const postFriendReqCtl = async (req: Request, res: Response) => {
  try {
    const { senderId, recieverId } = req.body;
    const username = getUsername(req, senderId);
    if (username) {
      const friendReq = await createFriendReq(senderId, recieverId);
      return res
        .status(200)
        .json({
          successed: true,
          data: {
            friendRequest: friendReq,
          },
        })
        .end();
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const acceptFriendReqCtl = async (req: Request, res: Response) => {
  try {
    const { requestId, senderId, recieverId } = req.body;
    const username = getUsername(req, recieverId);
    if (username && username == recieverId) {
      const friendShip = await acceptFriendReq(requestId, senderId, recieverId);
      return res
        .status(200)
        .json({
          successed: true,
          data: {
            friendShip: friendShip,
          },
        })
        .end();
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const getFriendReqToCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.params.username as string);

    if (username && username == req.params.username) {
      const friendReqList = await getFriendReqTo(username);
      return res
        .status(200)
        .json({
          successed: true,
          data: {
            friendReqList: friendReqList,
          },
        })
        .end();
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const getFriendReqFromCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.params.username as string);

    if (username && username == req.params.username) {
      const friendReqList = await getFriendReqFrom(username);
      return res
        .status(200)
        .json({
          successed: true,
          data: {
            friendReqList: friendReqList,
          },
        })
        .end();
    } else throw new CustomAPIError("You don't have permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};
export const checkFriendShipCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username1 as string);
    if (username && username == req.query.username1) {
      const isFriend = await checkFriendShip(
        username,
        req.query.username2 as string
      );
      return res
        .status(200)
        .json({ successed: true, data: { isFriend: isFriend } });
    } else throw new CustomAPIError("You don't have permission", 403);
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const getRelationShipTwoUserCtl = async (
  req: Request,
  res: Response
) => {
  try {
    const username = getUsername(req, req.query.username1 as string);
    if (username && username == req.query.username1) {
      const rel = await checkRelTwoUser(
        username,
        req.query.username2 as string
      );
      return res.status(200).json({ successed: true, data: rel });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export type ShareParam = {
  senderId: string;
  id: string;
  recieverId: string;
  type: string;
  resourceLink: string;
};

export const shareResourceCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.body.senderId);
    //console.log(req.body);
    if (username && username == req.body.senderId) {
      const params: ShareParam = req.body;
      const sharePTP = await shareResource(params);
      return res.status(201).json({
        successed: true,
        data: {
          sharePTP: sharePTP,
        },
      });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const getShareResourceCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.params.username);
    let limit =
      typeof req.query.limit == "string" ? Number(req.query.limit) : 10;

    //console.log(`username from getShareRsCtl: ${username}`);

    if (username && username == req.params.username) {
      const shares = await getShareResource(username, limit);
      return res.status(200).json({
        successed: true,
        data: {
          shares: shares,
        },
      });
    } else throw new CustomAPIError("You dont't have permission", 403);
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const lookedShareCtl = async (req: Request, res: Response) => {
  try {
    // 2 thu dung username + shareId

    const username = getUsername(req, req.body.username);
    const { shareId } = req.params;
    if (username && username == req.body.username) {
      const share = await lookedShare(shareId, username);
      return res.status(200).json({
        successed: true,
        data: {
          share: share,
        },
      });
    } else throw new CustomAPIError("Not have permisson", 403);
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export type CreateGroupParam = {
  name: string;
  creatorId: string;
};

export const createGroupCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.body.creatorId);
    if (username && username == req.body.creatorId) {
      const params: CreateGroupParam = req.body;
      const group = await createGroup(params);

      return res.status(200).json({
        successed: true,
        data: {
          group: group,
        },
      });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export type AddUserGroupParam = {
  username1: string;
  username2: string;
  groupId: string;
};

export const addUserToGroupCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.body.username1);
    //console.log(req.body.username1);
    if (username && username == req.body.username1) {
      const params: AddUserGroupParam = req.body;
      const result = await addUserToGroup(params);

      return res.status(200).json({ successed: true, data: result });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};
export type CreatePostParam = {
  content: string;
  groupId: string;
  authorId: string;
  title: string;
};

export const createPostGroupCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.body.authorId);
    if (username && username == req.body.authorId) {
      const params: CreatePostParam = req.body;
      const result = await createPostGroup(params);

      return res.status(200).json({
        successed: true,
        data: {
          post: result,
        },
      });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const getGroupListCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.params.username);
    if (username && username == req.params.username) {
      const groups = await getGroupList(username);
      return res.status(200).json({
        successed: true,
        data: {
          groups: groups,
        },
      });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};
export const getGroupMemberCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    const groupId = req.query.groupId;

    if (username && typeof groupId == "string") {
      const users = await getGroupMember(groupId, username);
      return res.status(200).json({
        successed: true,
        data: {
          members: users,
        },
      });
    } else throw new CustomAPIError("Not Permission", 403);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};
export type GetGroupPostsParam = {
  after: string | undefined;
  before: string | undefined;
  limit: number;
};

// group/:groupId/post?after=

export const getGroupPostListCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    const groupId = req.params.groupId;
    const { limit, after, before } = req.query;

    const ok =
      (typeof after == "string" || typeof after == "undefined") &&
      (typeof before == "string" || typeof before == "undefined");
    if (username && ok) {
      const params: GetGroupPostsParam = {
        limit: Number(limit),
        after: after,
        before: before,
      };
      const posts = await getGroupPostList(groupId, params);
      let latest = "",
        oldest = "";
      if (posts.length > 0) {
        latest = posts[0].id;
        oldest = posts[posts.length - 1].id;
      }
      return res.status(200).json({
        successed: true,
        data: {
          posts: posts,
          latest: latest,
          oldest: oldest,
        },
      });
    } else throw new CustomAPIError("", 400);
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const setSeenMsgSessionP2PCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, "");
    //console.log(`set seen msg of session: ${req.params.sessionId as string}`);
    if (!username) throw new CustomAPIError("Not Permission", 403);
    await setSeenMsgSessionP2P(username, req.params.sessionId as string);
    return res.status(200).json({ successed: true });
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};

export const findUserByEmailCtl = async (req: Request, res: Response) => {
  try {
    const user = await findUserByEmail(req.query.email as string);
    return res.status(200).json({
      successed: true,
      data: {
        user: user,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode ? error.statusCode : 400)
      .json({ successed: false, message: error.message })
      .end();
  }
};
