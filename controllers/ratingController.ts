import express from "express";
import {getRatings} from "../services/ratingService";

export const getRatingsCtl =  async (req: express.Request, res: express.Response) => {
    try{
        const data = await getRatings(Number(req.query.start));
        return res.status(200).json({
            successed: true, 
            data: data
        });
        

    }catch(error){
        return res.status(400).json({
            successed: false, 
            message: "Some error occured",
        });
    }
    
}