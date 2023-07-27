import { Request, Response } from "express";
import CustomAPIError from "../config/CustomAPIError";
import {
  getChatSessionP2P,
  getChatSessionP2PList,
  getContactList,
  getGroupMessage,
  getGroupPostMsg,
  getMessageP2P,
  insertMessageP2P,
} from "../services/chatService";
import { getUsername } from "../utils/checkUser";

export type ReferenceMessage = {
  id: string;
  summary: string;
  author: string;
};

export type InsertChatParam = {
  content: string;
  username: string;
  postId: string | null;
  sessionId: string | null;
  referenceMessage: ReferenceMessage | null;
  type: string;
  groupId: string | null;
};

export type InsertChatMsgP2P = {
  content: string;
  username: string;
  recieverId: string;
  sessionId: string | null;
  referenceMessage: ReferenceMessage | null;
};

export type InsertChatMsgGroup = {
  content: string;
  username: string;
  sessionId: string;
  groupId: string;
  referenceMessage: ReferenceMessage | null;
  postId: string | null;
};
export type InsertPostMsg = {
  content: string;
  username: string;
  groupId: string;
  referenceMessage: ReferenceMessage | null;
  postId: string;
};

/*
export const addChatMessageCtl = async (req: Request, res: Response) =>{
    try {
        const username = getUsername(req, req.body.username);
        if(username && username == req.body.username){
            const params = req.body;

            const chatMessage = await insertChatMessage(params);
            return res.status(201).json({successed: true, data: {
                chatMessage : chatMessage,
            }});
        }
    }
    catch(error){
        console.log(error);
        return res.status(400).json({successed: false, message: error});
    } 
}
*/
// link: /post/:postId/message?username=""

export type GetPostMsgParam = {
  limit: number;
  before: string | undefined;
  after: string | undefined;
};

export const getPostMessageCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    if (!username) throw new CustomAPIError("Not Authenticate", 403);
    const { postId } = req.params;
    const { limit, before, after } = req.query;
    //console.log(`${limit}, ${before}, ${after}, postID: ${postId}`);

    const params: GetPostMsgParam = {
      limit: Number(limit),
      before: typeof before == "string" ? before : undefined,
      after: typeof after == "string" ? after : undefined,
    };

    //const chatMessages = await getPostMessages(postId,params,username);
    const messages = await getGroupPostMsg(postId, username, params);
    return res.status(200).json({
      successed: true,
      data: {
        chatMessages: messages,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};

export type GetGroupMsgParam = {
  limit: number;
  before: string | undefined;
  after: string | undefined;
};
export type GetMessageParam = {
  limit: number;
  before: string | undefined;
  after: string | undefined;
};
export const getGroupMsgCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    if (!username) throw new CustomAPIError("Not Authenticate", 403);
    const { groupId } = req.params;
    const { limit, before, after } = req.query;
    const params: GetGroupMsgParam = {
      limit: Number(limit),
      before: typeof before == "string" ? before : undefined,
      after: typeof after == "string" ? after : undefined,
    };
    const result = await getGroupMessage(groupId, username, params);

    return res.status(200).json({
      successed: true,
      data: {
        chatMessages: result.messages,
        sessionId: result.sessionId,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};

export const getMessageP2PCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    if (!username) throw new CustomAPIError("Not Authenticate", 403);
    const { sessionId } = req.params;
    const { limit, before, after } = req.query;
    const params: GetGroupMsgParam = {
      limit: Number(limit),
      before: typeof before == "string" ? before : undefined,
      after: typeof after == "string" ? after : undefined,
    };
    const messages = await getMessageP2P(username, sessionId, params);

    return res.status(200).json({
      successed: true,
      data: {
        chatMessages: messages,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};
export type GetChatSessionP2PParam = {
  before: string | undefined;
};

export const getChatSessionP2PListCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    if (!username) throw new CustomAPIError("Not Authenticate", 403);
    const { before } = req.query;
    const params: GetChatSessionP2PParam = {
      before: typeof before === "string" ? before : undefined,
    };

    const chatList = await getChatSessionP2PList(username, params);

    return res.status(200).json({
      successed: true,
      data: {
        chatSessions: chatList,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};

export const getChatSessionP2PCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, req.query.username as string);
    if (!username) throw new CustomAPIError("Not Authenticate", 403);
    const chatSession = await getChatSessionP2P(username, req.params.sessionId);
    return res.status(200).json({
      successed: true,
      data: {
        chatSession: chatSession,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};
export const insertMessageP2PCtl = async (req: Request, res: Response) => {
  try {
    const result = await insertMessageP2P(req.body as InsertChatMsgP2P);

    return res.status(201).json({
      successed: true,
      data: {
        chatMessage: result,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ successed: false, message: error.message });
  }
};
export const getContactListCtl = async (req: Request, res: Response) => {
  try {
    const username = getUsername(req, "");

    if (!username) throw new CustomAPIError("Not Authenticate", 403);
    const contactList = await getContactList(username);

    return res.status(201).json({
      successed: true,
      data: {
        contactList: contactList,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode)
      .json({ successed: false, message: error.message });
  }
};
