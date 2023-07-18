import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET = process.env.SECRET || 'SECRET';

export const generateToken = (username: string)=>{
    return jwt.sign({username: username}, SECRET , {expiresIn: '1d'});
}

export const getUsernameFromToken = (token:string)=>{
    try{
        return (jwt.decode(token) as any).username;
    }catch(error){
        throw error;
    }
}