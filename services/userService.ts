import { PrismaClient, User, UserProfile } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import CustomAPIError from '../config/CustomAPIError';
import { RequestWithAuth } from '../config/Interface';
import auth0Client from '../config/auth0Client';

const prisma = new PrismaClient();

export const getUserProfileFromAuth0 = async (req: RequestWithAuth) => {
  // If the request comes from the client, accessToken will be in the body
  let { accessToken } = req.body;

  // If the request has been authenticated by the auth0 middleware (verifyToken middleware),
  // accessToken will be in req.auth.token. You can find the verifyToken middleware in server.ts file.
  if (!accessToken) {
    console.log(
      'accessToken in req.body is empty! Trying to get it from req.auth.token!'
    );
    accessToken = req.auth.token;
  }
  console.log(`accessToken at get from auth0Client: ${accessToken}`);

  if (!accessToken) {
    throw new CustomAPIError('No token provided!', StatusCodes.UNAUTHORIZED);
  }

  const userFromAuth0 = await auth0Client.getProfile(accessToken);

  return userFromAuth0;
};

export const getUserByEmail = async (email: string) => {
  const user: User | null = await prisma.user.findUnique({
    where: { email }
  });
  return user;
};

export const getUserByUsername = async (
  username: string,
  includeUserProfile: boolean = false
) => {
  const user: any = await prisma.user.findUnique({
    where: { username },
    include: {
      UserProfile: includeUserProfile
    }
  });
  return user;
};

export const createUser = async (
  username: string,
  email: string,
  auth0_id: string
) => {
  const user: User = await prisma.user.create({
    data: {
      username,
      email,
      auth0_id
    }
  });
  return user;
};

export const createUserProfile = async (
  real_name: string,
  avatar: string,
  username: string
) => {
  const userProfile = await prisma.userProfile.create({
    data: {
      real_name,
      avatar,
      user: {
        connect: { username }
      }
    }
  });
  return userProfile;
};

export const updateUserProfileAfterLogin = async (
  userFromDB: User,
  userFromAuth0: any
) => {
  // We need to update auth_id in case the user has changed their way of logging in
  if (
    userFromDB.email === userFromAuth0.email &&
    userFromDB.auth0_id !== userFromAuth0.sub
  ) {
    await prisma.user.update({
      where: { username: userFromDB.username },
      data: { auth0_id: userFromAuth0.sub }
    });

    // Update user profile after updating auth0_id only if the user used Google or Github
    if (
      userFromAuth0.sub.includes('google-oauth2') ||
      userFromAuth0.sub.includes('github')
    ) {
      await prisma.userProfile.update({
        where: { username: userFromDB.username },
        data: {
          real_name: userFromAuth0.name,
          avatar: userFromAuth0.picture
        }
      });
    }
  }
};
