import { ChatMessage } from "@prisma/client";
import { Socket, Server } from "socket.io";
import {
  InsertChatMsgGroup,
  InsertChatMsgP2P,
  InsertPostMsg,
  ReferenceMessage,
} from "./controllers/chatController";
import {
  getUserSockets,
  insertUserSocket,
  removeUserSocket,
  setUserSockets,
} from "./redis/baseService";
import {
  insertGroupMessage,
  insertGroupPostMsg,
  insertMessageP2P,
} from "./services/chatService";
import { getGroupMemberNoCheck } from "./services/userService2";
import { getUsernameFromToken } from "./utils/token";
import {} from "./services/GameDataService";
import { initRoom, joinQuiz, leaveQuiz } from "./services/GameRoomService";
import { removeRoom } from "./redis/gameService";
import { generateGameRoomId } from "./utils/genId";

export const MESSAGE_TYPE = {
  MESSAGE_P2P: "MESSAGE_P2P",
  MESSAGE_GROUP: "MESSAGE_GROUP",
  MESSAGE_GROUP_POST: "MESSAGE_GROUP_POST",
};

let io: any = null;

type SubmiMessageParam = {
  username: string;
  message: string;
  postId: string;
  sessionId: string;
  groupId: string;
  type: string;
  recieverId: string;
  referenceMessage: null | ReferenceMessage;
};
const GAME_STATE = {
  NONE: 0,
  WAITING: 1,
  IN_GAME_ROOM: 2,
};
type SocketInfo = {
  username: string;
};
type WatingSockets = {
  startTime: number;
  sockets: Array<{ socket: Socket; socketInfo: SocketInfo }>;
};

let waitingRoom: string | null = null;

export const maxClientRoom = 2;

const maxWaitTime = 3 * 1000;

const waitingSocketMap = new Map<string, WatingSockets>();
waitingSocketMap.set("r1", { startTime: 0, sockets: [] });
let isCheckWaitingSocket = false;

const startGameRoom = async (
  waitingSockets: WatingSockets,
  roundId: string
) => {
  const randRoomId = generateGameRoomId();
  const rId = `room:${randRoomId}`;

  const socketList = waitingSockets.sockets.map((item) => ({
    socketId: item.socket.id,
    username: item.socketInfo.username,
  }));

  const result = await initRoom(rId, roundId, socketList);

  waitingSocketMap.set(roundId, {
    startTime: 0,
    sockets: [],
  });

  waitingSockets?.sockets.forEach((soc) => {
    if (soc.socket.connected) {
      soc.socket.join(rId);
    }
  });

  waitingSockets.sockets = [];

  io.to(rId).emit("start-match", {
    matchInfo: {
      users: socketList,
      roomId: rId,
    },
    matchState: result,
  });

  console.log("start match: " + rId);
};

let checkWattingSocket = () => {
  isCheckWaitingSocket = true;
  let existWaitingSocket = false;
  //console.log("in function check");

  waitingSocketMap.forEach((waitingSocket: WatingSockets, roundId: string) => {
    if (waitingSocket.sockets.length > 0) {
      if (Date.now() - waitingSocket.startTime > maxWaitTime) {
        console.log(`start match of round ${roundId} `);

        startGameRoom(waitingSocket, roundId);
      }
      existWaitingSocket = true;
    }
  });

  if (!existWaitingSocket) {
    isCheckWaitingSocket = false;
    clearInterval(checkWattingSocketInterval);
  }
};
let checkWattingSocketInterval = setInterval(checkWattingSocket, 3000);

const leaveGameRoom = (socket: Socket) => {
  let roomId = null;
  socket.rooms.forEach((r) => {
    if (r != socket.id) roomId = r;
  });
  if (roomId) {
    const room = io.sockets.adapter.rooms.get(roomId);

    if (room && room.size == 1) {
      console.log("remove room " + roomId);
      removeRoom(roomId);
    } else if (room) {
      io.to(roomId).emit("leave-game", {
        socketId: socket.id,
        username: socket.data.username,
      });
    }
    socket.data.gameState = GAME_STATE.NONE;
    socket.leave(roomId);
  }
};

export const initIOSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (socket: Socket) => {
    socket.data.gameState = GAME_STATE.NONE;
    socket.emit("send-id", { id: socket.id });

    socket.on("auth", async (data: any) => {
      try {
        const username = getUsernameFromToken(data.accessToken);
        socket.data.username = username;
        insertUserSocket(username, socket.id);
      } catch (error) {
        console.log("error occur when getting profile from accessToken");
      }
    });

    setTimeout(() => {
      if (!socket.data.username) socket.disconnect();
    }, 3000);

    socket.on("game-req", (data: any) => {
      console.log(`GAME REQ FROM SOCKET: ${socket.id}`);
      if (socket.data.gameState != GAME_STATE.NONE) {
        return;
      }

      let waitingSockets = waitingSocketMap.get(data.roundId);

      if (waitingSockets) {
        if (waitingSockets.sockets.length == 0)
          waitingSockets.startTime = Date.now();

        waitingSockets.sockets.push({
          socket: socket,
          socketInfo: { username: data.username },
        });

        socket.data.gameState = GAME_STATE.WAITING;

        if (
          waitingSockets.sockets.length >= maxClientRoom ||
          Date.now() - waitingSockets.startTime > maxWaitTime
        ) {
          const randRoomId = generateGameRoomId();
          const rId = `room:${randRoomId}`;
          const socketList = waitingSockets.sockets.map((item) => ({
            socketId: item.socket.id,
            username: item.socketInfo.username,
          }));

          initRoom(rId, data.roundId, socketList)
            .then((result) => {
              waitingSockets?.sockets.forEach((soc) => {
                if (soc.socket.connected) {
                  soc.socket.join(rId);
                  soc.socket.data.gameState = GAME_STATE.IN_GAME_ROOM;
                }
              });
              if (waitingSockets) {
                waitingSockets.sockets = [];
              }

              io.to(rId).emit("start-match", {
                matchInfo: {
                  users: socketList,
                  roomId: rId,
                },
                matchState: result,
              });

              console.log("start match: " + rId);
            })
            .catch((error) => {
              socket.emit("error-connect", error);
              console.log(error);
            });
        } else if (!isCheckWaitingSocket) {
          checkWattingSocketInterval = setInterval(checkWattingSocket, 3000);
        }
      }
    });

    socket.on("client-send-state", (data: any) => {
      socket.broadcast.to(data.roomId).emit("server-send-state", data);
    });

    socket.on("quiz", (data: any) => {
      // data : roomId , quizKey: dig, actionType: Enter | Leave -> ?
      const arr = (data.roomId as string).split(":");     
      let room = null;
      socket.rooms.forEach((r) => {
        if (r != socket.id) room = r;
      });

      if (data.roomId == room) {
        if (data.type == "enter") {
          joinQuiz(data.roomId, data.quizKey, socket.id)
            .then((result) => {
              let lst: any = [];
              if (result != null) {
                lst = [{ quizKey: data.quizKey, quizState: result.quizState }];
              }
              io.to(data.roomId).emit("quiz-state", { quizStateList: lst });
            })
            .catch((error) => {
              console.log(error);
              io.to(data.roomId).emit("quiz-state", { quizStateList: [] });
            });
        } else {
          leaveQuiz(data.roomId, data.quizKey, socket.id, data.result)
            .then((result) => {
              let lst: any = [];
              if (result != null) {
                lst = [{ quizKey: data.quizKey, quizState: result.quizState }];
              }
              io.to(data.roomId).emit("quiz-state", {
                quizStateList: lst,
                matchState: result.matchState,
              });
            })
            .catch((error) => {
              io.to(data.roomId).emit("quiz-state", { quizStateList: [] });
            });
        }
      } else socket.emit("quiz-state", { quizStateList: [] });
    });

    socket.on("leave-game-room", () => {
      console.log(`socket ${socket.id} leave game`);
      leaveGameRoom(socket);
    });

    socket.on("disconnecting", () => {
      leaveGameRoom(socket);
      removeUserSocket(socket.data.username, socket.id);
    });

    socket.on("disconnect", () => {
      if (waitingRoom == socket.id) {
        waitingRoom = null;
      }
      console.log(socket.id + " disconnected");
    });

    socket.on("disconnnect-user", () => {
      console.log(
        `user: ${socket.data.username} disconnect socket: ${socket.id}`
      );
      removeUserSocket(socket.data.username, socket.id);
    });

    socket.on("submit-message", async (data: SubmiMessageParam) => {
      try {
        if (socket.data.username == data.username) {
          let chatMessage: any = null;

          switch (data.type) {
            case MESSAGE_TYPE.MESSAGE_P2P:
              const paramP2p: InsertChatMsgP2P = {
                content: data.message,
                recieverId: data.recieverId,
                referenceMessage: data.referenceMessage,
                sessionId: data.sessionId,
                username: data.username,
              };
              //console.log("insert message p2p");
              chatMessage = await insertMessageP2P(paramP2p);
              break;
            case MESSAGE_TYPE.MESSAGE_GROUP:
              const paramGroup: InsertChatMsgGroup = {
                content: data.message,
                groupId: data.groupId,
                postId: data.postId,
                referenceMessage: data.referenceMessage,
                sessionId: data.sessionId,
                username: data.username,
              };
              chatMessage = await insertGroupMessage(paramGroup);
              break;
            case MESSAGE_TYPE.MESSAGE_GROUP_POST:
              const paramGroupPost: InsertPostMsg = {
                content: data.message,
                groupId: data.groupId,
                postId: data.postId,
                referenceMessage: data.referenceMessage,
                username: data.username,
              };
              chatMessage = await insertGroupPostMsg(paramGroupPost);
              break;
            default:
              break;
          }


          if (chatMessage) {
            if (
              data.type === MESSAGE_TYPE.MESSAGE_GROUP ||
              data.type === MESSAGE_TYPE.MESSAGE_GROUP_POST
            ) {
              const users = await getGroupMemberNoCheck(data.groupId);

              if (users) {
                users.forEach((user) =>
                  sendMessage(user.username, chatMessage, data.type)
                );
              }
            } else {
              sendMessage(data.username, chatMessage, data.type);
              sendMessage(data.recieverId, chatMessage, data.type);
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  });
};

const sendMessage = async (
  username: string,
  chatMessage: ChatMessage,
  type: string
) => {
  if (!io) return;
  const socketIds: Array<string> = await getUserSockets(username);
  const lst: Array<string> = [];
  let changed = false;
  socketIds.forEach((id) => {
    const socket = io.sockets.sockets.get(id);
    if (socket && socket.connected) {
      socket.emit("new-message", { message: chatMessage, type: type });
      lst.push(id);
    } else changed = true;
  });
  if (lst.length > 0) setUserSockets(username, lst);
};
