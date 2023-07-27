import {
  getQuizList,
  insertQuizResult,
  insertQuizRound,
} from "../redis/gameService";

export type Quiz = {
  quizKey: string;
  quizType: string;
  quizData: any;
  quizPoint: number;
  result: number;
};

export const addQuizRound = async (roundId: string, quizList: Array<Quiz>) => {
  try {
    const quizzes: any = {},
      quizResults: any = {};

    quizList.forEach((quiz) => {
      quizzes[quiz.quizKey] = JSON.stringify({
        quizType: quiz.quizType,
        quizData: quiz.quizData,
        quizPoint: quiz.quizPoint,
      });

      quizResults[quiz.quizKey] = quiz.result;
    });
    //console.log(quizzes);

    await insertQuizRound(roundId, quizzes);
    //console.log("add duoc thang quiz");
    await insertQuizResult(roundId, quizResults);
  } catch (error) {
    throw error;
  }
};

export const getQuizRound = async (roundId: string) => {
  try {
    //console.log(`get quiz round: ${roundId}`);
    const quizMap = await getQuizList(roundId);
    const result: any = {};
    Object.keys(quizMap).forEach((key) => {
      result[key] = JSON.parse(quizMap[key]);
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
