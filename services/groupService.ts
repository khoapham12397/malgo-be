import { PrismaClient } from "@prisma/client";
import { generator } from "../utils/genId";

const prisma = new PrismaClient();

type CreateGroupParam = {
  name: string;
  creatorId: string;
};

export const createGroup = async (params: CreateGroupParam) => {
  try {
    const group = await prisma.group.create({
      data: {
        name: params.name,
        creatorId: params.creatorId,
      },
    });
    return group;
  } catch (error) {
    throw error;
  }
};

type AddUserGroupParam = {
  username1: string;
  username2: string;
  groupId: string;
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
    if (!userGroup) throw Error("You don't have permission");
    return await prisma.userGroupRel.create({
      data: {
        groupId: params.groupId,
        username: params.username2,
        joinedAt: Date.now().toString(),
      },
    });
  } catch (error) {
    throw error;
  }
};

type CreatePostParam = {
  content: string;
  groupId: string;
  authorId: string;
};

export const createPostGroup = async (params: CreatePostParam) => {
  try {
    const post = await prisma.groupPost.create({
      data: {
        id: generator.nextId().toString(),
        content: params.content,
        groupId: params.groupId,
        authorId: params.authorId,
        title: "",
      },
    });
    return post;
  } catch (error) {
    throw error;
  }
};
// nen store dang chat app dung:
