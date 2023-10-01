import { Prisma, PrismaClient } from "@prisma/client";
import CustomAPIError from "../config/CustomAPIError";
import {
  AddUserGroupParam,
  CreateGroupParam,
  CreatePostParam,
  GetGroupPostsParam,
  ShareParam,
} from "../controllers/userController2";
import { checkUserSocketExist } from "../redis/baseService";
import { generator } from "../utils/genId";
import { addSinleChatSessionP2P, getChatSessionP2PId } from "../redis/chatService";

const prisma = new PrismaClient();

export const getFriendList = async (username: string) => {
  try {
    const frdShipList = await prisma.friendShip.findMany({
      select: {
        username1: true,
        username2: true,
      },
      where: {
        OR: [{ username1: username }, { username2: username }],
      },
    });
    const lst = [];
    for (let i = 0; i < frdShipList.length; i++) {
      let online = false,
        name = username;
      if (frdShipList[i].username1 === username) {
        online = await checkUserSocketExist(frdShipList[i].username2);
        name = frdShipList[i].username2;
      } else {
        online = await checkUserSocketExist(frdShipList[i].username1);
        name = frdShipList[i].username1;
      }

      lst.push({
        username: name,
        isOnline: online == true,
      });
    }
    //return frdShipList.map(item=> (item.username1 == username)?item.username2:item.username1);
    return lst;
  } catch (error) {
    throw error;
  }
};

export const createFriendReq = async (senderId: string, recieverId: string) => {
  try {
    const friendReq = await prisma.friendRequest.create({
      data: {
        senderId: senderId,
        recieverId: recieverId,
      },
    });

    return friendReq;
  } catch (error) {
    throw error;
  }
};

export const getFriendReqTo = async (username: string) => {
  try {
    const friendReq = await prisma.friendRequest.findMany({
      where: {
        recieverId: username,
        disable: false,
      },
    });
    return friendReq;
  } catch (error) {
    throw error;
  }
};
export const getFriendReqFrom = async (username: string) => {
  try {
    const friendReq = await prisma.friendRequest.findMany({
      where: {
        senderId: username,
      },
    });
    return friendReq;
  } catch (error) {
    throw error;
  }
};

export const acceptFriendReq = async (
  reqId: string,
  senderId: string,
  recieverId: string
) => {
  try {
    const friendShip = await prisma.friendShip.create({
      data: {
        username1: senderId,
        username2: recieverId,
      },
    });
    
    await prisma.friendRequest.update({
      where: {
        id: reqId,
      },
      data: {
        disable: true,
      },
    });
    const sessionId =  await getChatSessionP2PId(senderId,recieverId);    
    if(!sessionId) {
      const usersInfo = [senderId, recieverId];
    

      const chatSession = await prisma.chatSession.create({
        data: {
          lastUpdate: new Date(Date.now()),
          lastMessage: {
            message: "You are connected",
            type: "system",
            authorId: "system",
          } as Prisma.JsonObject,
          id: generator.nextId().toString(),
          type: "p2p",
          usersInfo: usersInfo as Prisma.JsonArray,
        },
      });
      
      await addSinleChatSessionP2P({
        id: chatSession.id, 
        usersInfo: usersInfo,
      });

      await prisma.chatSessionUser.createMany({
        data: [
          {
            sessionId: chatSession.id,
            joinedAt: new Date(Date.now()),
            username: senderId,
            unseenCnt: 0,
          },
          {
            sessionId: chatSession.id,
            joinedAt: new Date(Date.now()),
            username: recieverId,
            unseenCnt: 0,
          },
        ],
      });
      }
      return friendShip;
  } catch (error) {
    throw error;
  }
};


export const checkFriendShip = async (username1: string, username2: string) => {
  try {
    const friendShip = await prisma.friendShip.findFirst({
      where: {
        OR: [
          {
            username1: username1,
            username2: username2,
          },
          {
            username1: username2,
            username2: username1,
          },
        ],
      },
    });
    return friendShip ? true : false;
  } catch (error) {
    throw error;
  }
};

export const RelTwoUser = {
  NONE: "NONE",
  FRIEND: "FRIEND",
  ONE_REQUEST_TWO: "ORT",
  TWO_REQUEST_ONE: "TRO",
};

export const checkRelTwoUser = async (username1: string, username2: string) => {
  try {
    const friendShip = await prisma.friendShip.findFirst({
      where: {
        OR: [
          {
            username1: username1,
            username2: username2,
          },
          {
            username1: username2,
            username2: username1,
          },
        ],
      },
      select: { id: true },
    });
    if (friendShip) {
      return {
        relationship: RelTwoUser.FRIEND,
        id: friendShip.id,
      };
    }

    const friendReq = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: username1,
            recieverId: username2,
          },
          {
            senderId: username2,
            recieverId: username1,
          },
        ],
        disable: false,
      },
      select: { id: true, senderId: true },
    });
    if (friendReq) {
      if (friendReq.senderId == username1)
        return {
          relationship: RelTwoUser.ONE_REQUEST_TWO,
          id: friendReq.id,
        };
      return {
        id: friendReq.id,
        relationship: RelTwoUser.TWO_REQUEST_ONE,
      };
    }

    return {
      relationship: RelTwoUser.NONE,
      id: null,
    };
    //return (lst?true:false);
  } catch (error) {
    throw error;
  }
};
export const shareResource = async (params: ShareParam) => {
  try {
    return await prisma.sharePTP.create({
      data: {
        senderId: params.senderId,
        receiverId: params.recieverId,
        resourceType: params.type,
        resourceId: params.id,
        id: generator.nextId().toString(),
        resourceLink: params.resourceLink,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getShareResource = async (username: string, limit: number) => {
  try {
    const share = await prisma.sharePTP.findMany({
      take: limit,
      where: {
        receiverId: username,
        look: false,
      },
      orderBy: {
        id: "desc",
      },
    });
    return share;
  } catch (error) {
    throw error;
  }
};

export const lookedShare = async (shareId: string, username: string) => {
  try {
    const share = await prisma.sharePTP.findUnique({
      where: {
        id: shareId,
      },
      select: {
        receiverId: true,
      },
    });
    if (share?.receiverId != username) {
      throw new CustomAPIError("You don't have permission", 403);
    }
    return await prisma.sharePTP.update({
      where: {
        id: shareId,
      },
      data: {
        look: true,
      },
    });
  } catch (error) {
    throw error;
  }
};
export const createGroup = async (params: CreateGroupParam) => {
  try {
    let group: any = await prisma.group.create({
      data: {
        name: params.name,
        creatorId: params.creatorId,
        users: {
          create: {
            username: params.creatorId,
            joinedAt: new Date(Date.now()),
          },
        },
      },
    });

    const chatSession = await prisma.chatSession.create({
      data: {
        id: generator.nextId().toString(),
        lastMessage: {},
        lastUpdate: new Date(Date.now()),
        type: "group",
        groupId: group.id,
      },
    });
    await prisma.group.update({
      where: {
        id: group.id,
      },
      data: {
        generalChatSessionId: chatSession.id,
      },
    });
    group.generalChatSessionId = chatSession.id;
    return group;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const addUserToGroup = async (params: AddUserGroupParam) => {
  try {
    const userGroup = await prisma.userGroupRel.findUnique({
      where: {
        username_groupId: {
          groupId: params.groupId,
          username: params.username1,
        },
      },
    });
    if (!userGroup) throw new CustomAPIError("Not permission", 403);
    const rel = await prisma.userGroupRel.create({
      data: {
        groupId: params.groupId,
        username: params.username2,
        joinedAt: new Date(Date.now()),
      },
    });
    // no se di vao trong cai thang uncaught dung;
    const isOnline = await checkUserSocketExist(params.username2);
    return {
      isOnline: isOnline,
      username: params.username2,
    };
  } catch (error) {
    throw error;
  }
};

export const createPostGroup = async (params: CreatePostParam) => {
  try {
    const post = await prisma.groupPost.create({
      data: {
        id: generator.nextId().toString(),
        content: params.content,
        groupId: params.groupId,
        authorId: params.authorId,
        title: params.title,
      },
    });

    return post;
  } catch (error) {
    throw error;
  }
};

export const getGroupList = async (username: string) => {
  try {
    //console.log("username: "+ username);
    const groupList = await prisma.group.findMany({
      where: {
        users: {
          some: {
            username: username,
          },
        },
      },
    });
    //console.log(groupList);
    return groupList;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const getGroupMember = async (groupId: string, username: string) => {
  try {
    const rel = await prisma.userGroupRel.findUnique({
      where: {
        username_groupId: {
          groupId: groupId,
          username: username,
        },
      },
    });

    if (!rel) {
      throw new CustomAPIError("You don't have permission", 403);
    }

    const users = await prisma.userGroupRel.findMany({
      where: {
        groupId: groupId,
      },
      select: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    //const userList = users.map(item => item.user);
    const lst = [];
    for (let i = 0; i < users.length; i++) {
      if (await checkUserSocketExist(users[i].user.username)) {
        lst.push({
          username: users[i].user.username,
          isOnline: true,
        });
      } else
        lst.push({
          username: users[i].user.username,
          isOnline: false,
        });
    }

    return lst;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const getGroupMemberNoCheck = async (groupId: string) => {
  try {
    //console.log(`find member of group: ${groupId}`);
    return await prisma.userGroupRel.findMany({
      where: {
        groupId: groupId,
      },
      select: {
        username: true,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const getChatSessionUser = async (sessionId: string) => {
  try {
    return await prisma.chatSessionUser.findMany({
      where: {
        sessionId: sessionId,
      },
      select: {
        username: true,
      },
    });
  } catch (error) {
    throw error;
  }
};
export const getGroupPostList = async (
  groupId: string,
  params: GetGroupPostsParam
) => {
  try {
    const { limit, after, before } = params;

    const posts = await prisma.groupPost.findMany({
      where: {
        id: {
          gt: after,
          lt: before,
        },
        groupId: groupId,
      },
      orderBy: {
        id: "desc",
      },
      take: limit,
    });
    return posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    //console.log(`find email : ${email}`);
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  } catch (error) {
    throw error;
  }
};
