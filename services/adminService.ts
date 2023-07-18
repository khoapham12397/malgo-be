import { PrismaClient, User } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import CustomAPIError from '../config/CustomAPIError';
import { AdminType } from '../config/Interface';

const prisma = new PrismaClient();

export const getAllUsers = async () => {
  const users: User[] = await prisma.user.findMany();
  return users;
};

export const disableUser = async (
  currentUser: User,
  usernameToDisable: string
) => {
  // super_admin > admin > regular_user
  if (currentUser.admin_type === AdminType.regular_user) {
    throw new CustomAPIError(
      'You are not allowed to disable users!',
      StatusCodes.UNAUTHORIZED
    );
  }

  const userToDisable = await prisma.user.findUnique({
    where: { username: usernameToDisable }
  });

  if (!userToDisable) {
    throw new CustomAPIError(
      'User to disable not found!',
      StatusCodes.NOT_FOUND
    );
  }

  if (
    currentUser.admin_type === AdminType.admin &&
    userToDisable.admin_type === AdminType.super_admin
  ) {
    throw new CustomAPIError(
      'You are not allowed to disable Super Admin!',
      StatusCodes.UNAUTHORIZED
    );
  }

  const result = await prisma.user.update({
    where: { username: usernameToDisable },
    data: { is_disabled: true }
  });

  return result;
};

export const enableUser = async (
  currentUser: User,
  usernameToEnable: string
) => {
  // super_admin > admin > regular_user
  if (currentUser.admin_type === AdminType.regular_user) {
    throw new CustomAPIError(
      'You are not allowed to enable users!',
      StatusCodes.UNAUTHORIZED
    );
  }

  const userToEnable = await prisma.user.findUnique({
    where: { username: usernameToEnable }
  });

  if (!userToEnable) {
    throw new CustomAPIError(
      'User to enable not found!',
      StatusCodes.NOT_FOUND
    );
  }

  if (
    currentUser.admin_type === AdminType.admin &&
    userToEnable.admin_type === AdminType.admin
  ) {
    throw new CustomAPIError(
      'Only Super Admin can enable!',
      StatusCodes.UNAUTHORIZED
    );
  }

  const result = await prisma.user.update({
    where: { username: usernameToEnable },
    data: { is_disabled: false }
  });

  return result;
};

export const deleteThreadById = async (threadId: string) => {
  // Delete all tags of this thread first
  const deletedThreadTags = await prisma.threadTagRel.deleteMany({
    where: { threadId }
  });

  // Delete all usersLiked of all comments in this thread first
  const deletedCommentsUserLikes = await prisma.userLikeComment.deleteMany({
    where: { comment: { threadId } }
  });

  // Delete all comments of this thread first
  const deletedComments = await prisma.comment.deleteMany({
    where: { threadId }
  });

  // Delete all userLikes of this thread first
  const deletedThreadUserLikes = await prisma.userLikeThread.deleteMany({
    where: { threadId }
  });

  // Delete thread
  const deletedThread = await prisma.thread.delete({
    where: { id: threadId },
    include: {
      userLikes: true
    }
  });

  return deletedThread;
};
