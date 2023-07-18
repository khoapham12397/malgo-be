import { Worker } from 'snowflake-uuid';
import shortUUID from 'short-uuid';
// const { Worker } = require('snowflake-uuid');

export const generator = new Worker(0, 1, {
	workerIdBits: 5,
	datacenterIdBits: 5,
	sequenceBits: 12,
});

export const generateThreadId = () => {
  return Date.now().toString();
};
export const generateCommentId = () => {
  return Date.now().toString();
};

export const generateGameRoomId = ()=>{
  return shortUUID.generate();
}

