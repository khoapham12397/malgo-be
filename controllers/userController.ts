import { PrismaClient, User, UserProfile } from '@prisma/client';
import { Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import CustomAPIError from '../config/CustomAPIError';
import { getUserByUsername } from '../services/userService';

const prisma = new PrismaClient();

/* ---------------------------- PUBLIC CONTROLLERS, NO AUTH REQUIRED ---------------------------- */
export const getAllProblems: RequestHandler = async (
  req: Request,
  res: Response
) => {
  return res.status(StatusCodes.OK).json({ message: 'Get all problems' });
};

export const getAllThreads: RequestHandler = async (
  req: Request,
  res: Response
) => {
  return res.status(StatusCodes.OK).json({ message: 'Get all threads' });
};

export const getProblemsBySearchTerm: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { searchTerm } = req.body;
  return res
    .status(StatusCodes.OK)
    .json({ message: `Get problems by search term: ${searchTerm}` });
};

export const getThreadsBySearchTerm: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { searchTerm } = req.body;
  return res
    .status(StatusCodes.OK)
    .json({ message: `Get threads by search term: ${searchTerm}` });
};

export const getProblemById: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  return res
    .status(StatusCodes.OK)
    .json({ message: `Get problem by id: ${id}` });
};

export const getThreadById: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  return res
    .status(StatusCodes.OK)
    .json({ message: `Get thread by id: ${id}` });
};
/* ---------------------------- PRIVATE CONTROLLERS, AUTH REQUIRED ---------------------------- */
export const getUserProfile: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const username: string = req.params.username;

    const userFromDB:
      | (User & {
          UserProfile: UserProfile | null;
        })
      | null = await getUserByUsername(username, true);

    if (!userFromDB) {
      throw new CustomAPIError('User not found!', StatusCodes.NOT_FOUND);
    }

    const { real_name, avatar } = userFromDB.UserProfile as {
      real_name: string;
      avatar: string;
    };

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Get user profile successfully',
      email: userFromDB.email,
      username: userFromDB.username,
      name: real_name,
      picture: avatar
    });
  } catch (error: any) {
    console.log(error.message);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};
