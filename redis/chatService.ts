import dotenv from "dotenv";
import { redisClient } from "./baseService";
dotenv.config();
type SessionP2P ={
    usersInfo: any;// array of string;
    id: string;
}
export const getChatSessionP2PKey = (username1: string, username2: string)=>{
  return `chat:session:p2p:${username1}:${username2}`;
}

export const addChatSessionP2PList = async (sessionList: Array<SessionP2P>)=>{
  for(let i=0;i< sessionList.length;i++) {
    await redisClient.set(`chat:session:p2p:${sessionList[i].usersInfo[0]}:${sessionList[i].usersInfo[1]}`, sessionList[i].id)
  }
}

export const addSinleChatSessionP2P = async (session: SessionP2P)=>{  
  await redisClient.SET(getChatSessionP2PKey(session.usersInfo[0], session.usersInfo[1]), session.id);
}

export const getChatSessionP2PId = async (username1: string, username2: string)=>{
  try{  
    let chatSessionId = await redisClient.get(`chat:session:p2p:${username1}:${username2}`);
    if(!chatSessionId) chatSessionId = await redisClient.get(`chat:session:p2p:${username2}:${username1}`);
    return chatSessionId;
  }
  catch(error){
    throw error;
  }
}

