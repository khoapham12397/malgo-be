import { Request,Response } from "express";
import { addQuizRound, getQuizRound, Quiz } from "../services/GameDataService";

export const getQuizRoundCtl =  async(req: Request , res:Response )=>{
    try{
        const quizMap = await getQuizRound(req.query.roundId as string);
        console.log(quizMap);

        if(quizMap) {
            return res.status(200).json({successed: true, data: {
                quizMap: quizMap 
            }}).end();
        }
        else return res.status(400).json({successed: false, message: "Round not found"});
        
    }

    catch(error){
        return res.status(400).json({successed: false, message: error});
    }     
}

export const addQuizRoundCtl = async (req: Request , res: Response) =>{    
    try {
        console.log("req body: ");
        console.log(req.body);        
        
        const {roundId, quizList} = req.body;
        await addQuizRound(roundId, quizList);

        return res.status(201).json({successed: true});
    }catch(error){
        return res.status(400).json({successed: false, message: error});
    }
}