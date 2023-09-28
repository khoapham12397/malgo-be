import {
  getAllContestResult,
  getLastUpdateRating,
  setLastUpdateRating,
} from "../redis/contestService";
import { PrismaClient } from "@prisma/client";
import { getContestListAfterTime } from "./contestService";

const prisma = new PrismaClient();

const { getNewRatings } = require("codeforces-rating-system");

export const exRating = () => {
  const contestants = [
    {
      position: 1,
      username: "forthright48",
      previousRating: 1500,
    },
    {
      position: 1,
      username: "flash_7",
      previousRating: 1500,
    },
    {
      position: 1,
      username: "labib666",
      previousRating: 1500,
    },
  ];

  const result = getNewRatings(contestants);
  console.log(result);
};

export const calRatingAfterContest = async (contestId: string) => {
  try {
    const usernames = await getAllContestResult(contestId); // sort by rank 1 -> rank n
    const ratings = await getRatingUserList(usernames);

    const mapRatings = new Map<string, number>();
    ratings.forEach((item) => {
      mapRatings.set(item.username, item.rating);
    });

    const lst = usernames.map((username, index) => ({
      position: index + 1,
      username: username,
      previousRating: mapRatings.get(username),
    }));
    const result = getNewRatings(lst);

    for (let i = 0; i < result.length; i++) {
      await prisma.userRating.update({
        where: {
          username: result[i].username,
        },
        data: {
          rating: result[i].newRating,
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const checkContestListAndCalRating = async () => {
  try {
    console.log("check contest and recal rating");

    const timestamp = await getLastUpdateRating();
    const contests = await getContestListAfterTime(timestamp);
    if (contests.length === 0) {
      console.log("All contest are updated rating");
      return;
    }

    for (let i = 0; i < contests.length; i++) {
      await calRatingAfterContest(contests[i].id);
    }

    const lastUpdateRating = await setLastUpdateRating();

    if (lastUpdateRating)
      console.log("LAST UPDATE RATING: " + new Date(lastUpdateRating));
  } catch (error) {
    throw error;
  }
};

export const getRatingUserList = async (usernameList: Array<string>) => {
  try {
    const ratings = await prisma.userRating.findMany({
      where: {
        username: {
          in: usernameList,
        },
      },
    });
    return ratings;
  } catch (error) {
    throw error;
  }
};

export const initUserRating = async () => {
  try {
    const users = await prisma.user.findMany({
      select: { username: true },
    });

    const initRating = users.map((user) => ({
      rating: 1000,
      username: user.username,
    }));

    const result = await prisma.userRating.createMany({
      data: initRating,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

export const getRatings = async (start: number)=>{
  try{
    const ratings = await prisma.userRating.findMany({
      take: 200,
      skip: start-1,
      orderBy :{
        rating: 'desc',
      }
    });
    const total = await prisma.userRating.count();
    return {
      ratings: ratings,
      total: total,
    };

  }
  catch(error){
    throw error;
  }
}