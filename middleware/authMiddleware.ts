import { PrismaClient, User } from "@prisma/client";
import { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../config/CustomAPIError";
import { AdminType, RequestWithAuth } from "../config/Interface";
import {
  getUserByEmail,
  getUserProfileFromAuth0,
} from "../services/userService";
import { merge } from "lodash";
import { getUsernameFromToken } from "../utils/token";
const prisma = new PrismaClient();

export const isAdmin = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userFromAuth0 = await getUserProfileFromAuth0(req);

    if (!userFromAuth0) {
      throw new CustomAPIError(
        "User not found from Auth0!",
        StatusCodes.NOT_FOUND
      );
    }

    // Find the user in database
    const userFromDB: User | null = await getUserByEmail(userFromAuth0.email);

    if (!userFromDB) {
      throw new CustomAPIError(
        "User not found from database!",
        StatusCodes.NOT_FOUND
      );
    }

    // Check if the user is an admin
    if (
      userFromDB.admin_type !== AdminType.admin &&
      userFromDB.admin_type !== AdminType.super_admin
    ) {
      throw new CustomAPIError(
        "User is not allowed!",
        StatusCodes.UNAUTHORIZED
      );
    }

    next();
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const isAuthenticated = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];
    //console.log("vao get token");
    if (!token) throw Error("Token not found");
    const username = getUsernameFromToken(token.substring(7));
    merge(req, { username: username });
    next();
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const isAuthenticatedOption = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];
    console.log(token);
    if (token && token.length > 20) {
      const username = getUsernameFromToken(token.substring(7));
      //console.log("find out token");
      merge(req, { username: username });
    }
    next();
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};
