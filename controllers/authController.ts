import { User } from '@prisma/client';
import { Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import shortUUID from 'short-uuid';
import {
  createUser,
  createUserProfile,
  getUserByEmail,
  getUserProfileFromAuth0,
  updateUserProfileAfterLogin
} from '../services/userService';
import {generateToken} from '../utils/token';
export const checkAuth: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userFromAuth0 = await getUserProfileFromAuth0(req);
    console.log('check auth');
    // Find the user in database
    const userFromDB: User | null = await getUserByEmail(userFromAuth0.email);

    let username: string;

    // If the user is not found in the database, create a new user
    if (!userFromDB) {
      const uuid = shortUUID.generate();

      // To handle the case multiple users with the same username, we add a unique id to the username to make it unique
      username = userFromAuth0.nickname + '@' + uuid;

      await createUser(username, userFromAuth0.email, userFromAuth0.sub);

      // Update new user profile after creating a new user
      await createUserProfile(
        userFromAuth0.name,
        userFromAuth0.picture,
        username
      );
    } else {
      username = userFromDB.username;
      await updateUserProfileAfterLogin(userFromDB, userFromAuth0);
    }
    // create accesstoken 
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'User logged in successfully 💪💪',
      username,
      email: userFromAuth0.email,
      token: generateToken(username),
    });
  } catch (error: any) {
    console.log(error);
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};
