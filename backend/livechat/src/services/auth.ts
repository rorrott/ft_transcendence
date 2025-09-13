import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config';

export function getUserFromToken(token: string): {userId: string, userName: string}
{
     if (!JWT_SECRET) 
     {
        throw new Error("JWT_SECRET is not defined in env");
     }
    try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return {userId: decoded.userId,userName: decoded.userName}
    } catch (err) {
    throw Error('Invalid Token')
    }
}
