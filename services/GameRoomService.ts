import {
  addOneSolve,
  getOneQuizResult,
  getOneQuizState,
  getOneQuiz_SocketInfo_Round,
  getQuizList,
  getQuizResultList,
  insertMatch,
  QUIZ_STATE,
  setOneQuizState,
} from "../redis/gameService";
export const initRoom = async (
  roomId: string,
  roundId: string,
  socketList: Array<any>
) => {
  try {
    const quizList = await getQuizList(roundId);
    const quizResultLst = await getQuizResultList(roundId);

    // socketList : [{socketId: '', username: ''}];

    const usernames = socketList.map((item) => item.username);
    const matchState: any = {
      startTime: Date.now(),
      maxTime: 40 * 60,
      users: JSON.stringify(usernames),
      roundId: roundId,
    };
    const initState = JSON.stringify({
      state: QUIZ_STATE.OPENING,
      socketId: null,
    });

    Object.keys(quizResultLst).forEach((quizKey) => {
      matchState[`quiz:${quizKey}`] = initState;
      matchState[`quiz:solved:${quizKey}`] = JSON.stringify([]);
    });
    console.log("quizResult list keys:");
    console.log(Object.keys(quizResultLst));

    console.log(`create match ID: ${roomId}`);
    console.log(matchState);

    socketList.forEach((item) => {
      matchState["socket:" + item.socketId] = JSON.stringify({
        username: item.username,
        point: 0,
        solvedQuizs: {},
      });
    });

    await insertMatch(roomId, matchState);
    const param: InitMatchParam = {
      maxTime: 40 * 60,
      quizKeyList: Object.keys(quizList),
      roundId: roundId,
      socketInfos: socketList,
      startTime: matchState,
    };

    const match = initMatchState(param);

    /*const match={
            roundId: roundId,
            startTime: matchState.startTime,
            maxTime: matchState.maxTime,
            users: usernames,
            quizStates: {},
            socketInfos: [],
            quizSolveds : {},
            mySolvedQuizs: {}            
        }
        */
    console.log(match);

    return match;
  } catch (error) {
    throw error;
  }
};

export const joinQuiz = async (
  roomId: string,
  quizKey: string,
  socketId: string
) => {
  try {
    const quizState = await getOneQuizState(roomId, quizKey);

    if (quizState.state != QUIZ_STATE.KEEPING) {
      const newState = { state: QUIZ_STATE.KEEPING, socketId: socketId };
      await setOneQuizState(roomId, quizKey, newState);
      console.log("quizState:");
      console.log(newState);
      return { quizState: newState };
    }
    return { quizState: quizState };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const leaveQuiz = async (
  roomId: string,
  quizKey: string,
  socketId: string,
  result: number | null
) => {
  try {
    let [quizState, quizSolved, socketInfo, roundId] =
      await getOneQuiz_SocketInfo_Round(roomId, quizKey, socketId);
    const rightAns = (await getOneQuizResult(roundId, quizKey)) == result;
    if (quizState.state != QUIZ_STATE.KEEPING) throw Error("");

    if (rightAns) {
      console.log("right ans");
      return await addOneSolve(roomId, quizKey, socketId);
      // result: {quizState , matchState}
    } else {
      console.log("wrong ans");

      const newState = {
        state: QUIZ_STATE.OPENING,
        socketId: null,
      };
      await setOneQuizState(roomId, quizKey, newState);
      return { quizState: newState, matchState: null, addedPoint: 0 };
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
type InitMatchParam = {
  socketInfos: Array<{ socketId: string; username: string }>;
  quizKeyList: Array<string>;
  roundId: string;
  startTime: number;
  maxTime: number;
};

export const initMatchState = (param: InitMatchParam) => {
  let quizStates: any = {},
    quizSolveds: any = {};
  param.quizKeyList.forEach((quizKey) => {
    quizStates[quizKey] = {
      quizState: QUIZ_STATE.OPENING,
      socketId: null,
    };
    quizSolveds[quizKey] = [];
  });

  return {
    roundId: param.roundId,
    users: param.socketInfos.map((item) => item.username),
    socketInfos: param.socketInfos.map((item) => ({
      ...item,
      point: 0,
      solvedQuizs: {},
    })),
    startTime: param.startTime,
    maxTime: param.maxTime,
    quizStates: quizStates,
    quizSolveds: quizSolveds,
  };
};
