import {redisClient} from "./baseService";

export const initRedisClient = async () =>{
    redisClient.on('error', error=>{
        console.log(error);
    });
    await redisClient.connect();
}


export const QUIZ_STATE = {
    OPENING: 0,
    KEEPING: 1,
    CLOSED : 2,
}

export const getQuizList = async (roundId: string)=>{
    try{
        const result = await redisClient.HGETALL(`round:${roundId}:quiz`);
        return result;
    }   
    catch(error){
        throw(error);
    }
}

export const getQuizResultList = async (roundId: string) =>{
    try{
        const results = await redisClient.HGETALL(`round:${roundId}:quiz:result`);
        return  results; 
    }catch(error){
        throw(error);
    }
}

export const insertQuizRound = async(roundId: string, quizList: any)=>{
    try{
        await redisClient.HSET(`round:${roundId}:quiz`,quizList);
    }catch(error) {
        console.log(error);
        throw(error);
    }
}

export const insertQuizResult = async (roundId: string, quizResults : any )=>{
    try{
        await redisClient.HSET(`round:${roundId}:quiz:result`, quizResults);
        
    }catch(error){
        console.log(error);
        throw(error);
    }
}

export const insertMatch = async (roomId :string,match: any) => {
    try {
        await redisClient.HSET(`match:${roomId}`, match);
        

    }catch(error){
        throw(error);
    }
}

export const initQuizList = async()=>{
    const quizList = [
        {position : "9-10", quizData: {
        description: "Với số nguyên dương N ta tính tích các chữ số của nó, tổng các chữ số của nó rồi cộng hai kết quả lại. Tổng cuối cùng ký hiệu là S(N ). Hỏi trong các số nguyên từ 1 đến 100 (kể cả 1 và 100) có bao nhiêu số N thỏa mãn S(N ) = N ?"
        , result: 3, options: [1,2,3,9]
    },
    quizType: "option"},
    { position: "12-36",
    quizData: {
        description: "Với số nguyên dương N ta tính tích các chữ số của nó, tổng các chữ số của nó rồi cộng hai kết quả lại. Tổng cuối cùng ký hiệu là S(N ). Hỏi trong các số nguyên từ 1 đến 100 (kể cả 1 và 100) có bao nhiêu số N thỏa mãn S(N ) = N ?"
        , result: 3, options: [1,2,3,9]
    },
    quizType: "option"
    }
    ];
    const arr:Array<string> = [];
    const resultLst:any = {};

    quizList.forEach(quiz=>{
        arr.push(quiz.position);
        arr.push(JSON.stringify({
            quizType: quiz.quizType,
            quizData: quiz.quizData,
            quizPoint: 100,
        }));
        resultLst[quiz.position] = quiz.quizData.result;
    });

    await redisClient.HSET('round:r1:quiz', arr);
    await redisClient.HSET('round:r1:quiz:result', resultLst);
    
}
export const createRoom =  async (roomId: string, roundId: string, socketList : Array<any>)=>{
    try{
        
        
        const initState= JSON.stringify({state: QUIZ_STATE.OPENING, socketId: null});
        // socketList : [{socketId: '', username: ''}];
        const usernames = socketList.map(item => item.username);
        
        const matchState :any = {
            'quiz:9-10': initState,
            'quiz:12-36': initState,
            startTime: Date.now(),
            maxTime: 40 * 60,
            users: JSON.stringify(usernames),
            roundId: roundId,
        }
        
        console.log(socketList);
        
        socketList.forEach(item=> {
            matchState['socket:'+item.socketId] = JSON.stringify({
                username: item.username, point: 0, solvedQuizs : {}
            });
        });

        await redisClient.HSET(`match:${roomId}`, matchState);

        console.log(matchState);
        
        return matchState;
    }catch(error) {
        throw(error);
    }
    
}

export const getOneQuizState = async (roomId: string, quizKey: string) => {
    try{
        const quizState = await redisClient.HGET(`match:${roomId}`, `quiz:${quizKey}`);
        if(quizState) {
            return JSON.parse(quizState);
        }
        throw Error("quiz not found");
    }catch(error){
        console.log(error);
        throw(error);
    }
}

export const setOneQuizState = async (roomId: string, quizKey: string, qState: {state: number, socketId: string|null}) => {
    try {
        await redisClient.HSET(`match:${roomId}`, `quiz:${quizKey}`, JSON.stringify(qState));
        
    }catch(error){
        throw(error);
    }
}


export const addOneSolve = async (roomId: string, quizKey :string, socketId: string)=>{
    try {        
        const [qState, sInfo, qSolved, roundId, usrs] = await redisClient.HMGET(`match:${roomId}`, [`quiz:${quizKey}`, `socket:${socketId}`, `quiz:solved:${quizKey}`,'roundId','users']);
        if(qState && sInfo && qSolved ) {
            
            const quizInfo = await redisClient.HGET(`round:${roundId}:quiz`, quizKey);
            
            const users = JSON.parse(usrs);
            
            let point = 0 ;
            
            if(quizInfo){
                console.log(quizInfo);
                point = (JSON.parse(quizInfo))["quizPoint"];
            }
            
            const   quizState = JSON.parse(qState),
                    socketInfo = JSON.parse(sInfo) ,
                    quizSolved = JSON.parse(qSolved),
                    solveTime = Date.now();
        
            const newState = {
                state: quizSolved.length < Math.min(Math.floor(users.length/2),2)?QUIZ_STATE.OPENING:QUIZ_STATE.CLOSED, 
                socketId: null,
            }   
            point = Math.max(0, point* (1- quizSolved.length/4));
            socketInfo.point += point;
            socketInfo.solvedQuizs[quizKey] = solveTime;
            const x :any= {};
            x[socketInfo.username] = solveTime;
            
            quizSolved.push(x);
            
            await redisClient.HSET(`match:${roomId}`,
            [`quiz:${quizKey}`, JSON.stringify(newState),
             `socket:${socketId}`, JSON.stringify(socketInfo),
             `quiz:solved:${quizKey}`, JSON.stringify(quizSolved)
            ]);    
            
            const match = await redisClient.HGETALL(`match:${roomId}`);
            

            const matchState : any = {
                roundId: match.roundId,
                users: JSON.parse(match.users),
                startTime: match.startTime,
                maxTime: match.maxTime,
                quizStates: {},
                socketInfos: [],
                mySolvedQuiz: {},
                quizSolveds: {},
            };
            
            Object.keys(match).forEach((key) => {

                if(key.substring(0,6) == 'socket') {
                    const socketInfo = JSON.parse(match[key])
                    matchState.socketInfos.push({
                        socketId: key.substring(7,key.length),
                        username: socketInfo.username,
                        solvedQuizs : socketInfo.solvedQuizs ,
                        point: socketInfo.point,             
                    });
                    
                    
                }
                
                if(key.substring(0,11) == 'quiz:solved'){
                    matchState.quizSolveds[key.substring(12, key.length)] = JSON.parse(match[key]);
                }
                else if(key.substring(0,4) == 'quiz') {
                    matchState.quizStates[key.substring(5,key.length)] = JSON.parse(match[key]);
                }
            })

            return {quizState: newState, matchState : matchState, addedPoint: point};

        }

        else throw Error();
    }catch(error){
        throw(error);
    }
}
export const getOneQuiz_SocketInfo_Round = async (roomId: string, quizKey: string,socketId: string) =>{

    try{   
        const [quizState, quizSolved,socketInfo ,roundId] = await redisClient.HMGET(`match:${roomId}`, [`quiz:${quizKey}`, `quiz:solved:${quizKey}`,`socket:${socketId}`,'roundId']);
        if(quizState && quizSolved && socketInfo) {
            return [JSON.parse(quizState), JSON.parse(quizSolved), JSON.parse(socketInfo),roundId];
        }
        else throw Error();
    }catch(error) {
        throw(error);
    }
}


export const getOneQuizResult = async (roundId:string, quizKey: string) =>{
    try{
        const result = await redisClient.HGET(`round:${roundId}:quiz:result`, quizKey);
        if(result) return Number(result);
        else throw Error('Quiz not found');

    }catch(error){  
        throw(error);
    }
}

export const enterQuiz = async (roomId : string, quizKey: string , socketId: string)=>{
    try {
        let qState :any = await redisClient.HGET(`match:${roomId}`, `quiz:${quizKey}`);
        console.log(`enter quiz req, key= ${quizKey}`);
    
        if(qState) {
            qState = JSON.parse(qState); 
            
            if(qState["state"] == QUIZ_STATE.OPENING) {
                const newState = JSON.stringify({state: QUIZ_STATE.KEEPING,socketId: socketId })
                await redisClient.HSET(`match:${roomId}`,`quiz:${quizKey}`,newState );

                console.log(`accepted enter quiz , key = ${quizKey}`);
                return newState;                      
            }
            
        }
        return null;
    }catch(error) {
        throw(error);
    }
}


export const leaveQuiz = async (roomId : string, quizKey: string , socketId: string, result: number | null)=>{
    try {

        let [qState,roundId] :any = await redisClient.HMGET(`match:${roomId}`, [`quiz:${quizKey}`,'roundId'] );
        let ans = Number(await redisClient.HGET(`round:${roundId}:quiz:result`,quizKey));
        

        if(qState) {
            qState = JSON.parse(qState);
            console.log(qState); 
            const successed = (ans == result);
            console.log("successed:"+ successed);
            let solveTime :any = null;
            if(qState["state"] == QUIZ_STATE.KEEPING) {
                const newState = JSON.stringify({state: successed?QUIZ_STATE.CLOSED:QUIZ_STATE.OPENING, socketId: successed?socketId:null})
                if(successed) {
                    let socketState :any = await redisClient.HGET(`match:${roomId}`, `socket:${socketId}`);
                    if(socketState) {
                        solveTime = Date.now();
                        socketState= JSON.parse(socketState);
                        socketState.solvedQuizs[`quiz:${quizKey}`] = solveTime;

                        const newSocState = JSON.stringify(socketState);
                        await redisClient.HSET(`match:${roomId}`, [`quiz:${quizKey}`, newState,`socket:${socketId}`, newSocState ]);                        
                    }
                }
                else {
                    await redisClient.HSET(`match:${roomId}`, `quiz:${quizKey}`, newState);                    
                }
                return newState;
            }
            
        }
        return null;
    }catch(error) {
        throw(error);
    }
}

export const removeRoom =async (roomId:string) => {
    try{
        await redisClient.DEL(`match:${roomId}`);
    }catch(error){
        console.log(error);
        throw(error);
    }
}

export default redisClient;
/**
 * matchState: {
 *  roundId: string;
 *  users: Array<string>; 
 *  startTime: string; //timestamp
 *  maxTime: string; //-> number
 *  quizSolveds: {
 *    "quizKey1": Array<{
 *         "username1": timeSolve (timestamp number),
 *         "username2": ...
 *      }>,
 *    "quizKey2": ...
 *  };
 *  quizStates : {
 *      "quizKey1" : {
 *         quizState : number;
 *         socketId: null | string; // socketId keep this quiz
 *
 *         },
 *      "quizKey2" : ...
 *  },
 *  socketInfos : Array<{socketId: string; username: string}>
 * }
 * 
 */