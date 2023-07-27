import { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../config/CustomAPIError";
import { RequestWithAuthAndUser } from "../config/Interface";
import {
  deleteThreadById,
  disableUser,
  enableUser,
  getAllUsers,
} from "../services/adminService";

export const getAllUsersController: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const users = await getAllUsers();
  return res.status(StatusCodes.OK).json({ success: true, users });
};

export const disableUserController: RequestHandler = async (
  req: RequestWithAuthAndUser,
  res: Response
) => {
  try {
    const { user: currentUser } = req;
    const usernameToDisable = req.params.username;

    if (!currentUser) {
      throw new CustomAPIError(
        "You are not logged in!",
        StatusCodes.UNAUTHORIZED
      );
    }

    if (!usernameToDisable) {
      throw new CustomAPIError(
        "Username is required!",
        StatusCodes.BAD_REQUEST
      );
    }

    if (currentUser?.username === usernameToDisable) {
      throw new CustomAPIError(
        "You cannot disable yourself!",
        StatusCodes.BAD_REQUEST
      );
    }

    const disabledUser = await disableUser(currentUser, usernameToDisable);
    return res.status(StatusCodes.OK).json({ success: true, disabledUser });
  } catch (error: any) {
    console.log(error.message);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const enableUserController: RequestHandler = async (
  req: RequestWithAuthAndUser,
  res: Response
) => {
  try {
    const { user: currentUser } = req;
    const usernameToEnable = req.params.username;

    if (!currentUser) {
      throw new CustomAPIError(
        "You are not logged in!",
        StatusCodes.UNAUTHORIZED
      );
    }

    if (!usernameToEnable) {
      throw new CustomAPIError(
        "Username is required!",
        StatusCodes.BAD_REQUEST
      );
    }

    if (currentUser?.username === usernameToEnable) {
      throw new CustomAPIError(
        "You cannot enable yourself!",
        StatusCodes.BAD_REQUEST
      );
    }

    const enabledUser = await enableUser(currentUser, usernameToEnable);
    return res.status(StatusCodes.OK).json({ success: true, enabledUser });
  } catch (error: any) {
    console.log(error.message);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const deleteThreadController: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { threadId } = req.params;

    if (!threadId) {
      throw new CustomAPIError(
        "Thread ID is required!",
        StatusCodes.BAD_REQUEST
      );
    }

    const deletedThread = await deleteThreadById(threadId);

    return res.status(StatusCodes.OK).json({ success: true, deletedThread });
  } catch (error: any) {
    console.log(error.message);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};
