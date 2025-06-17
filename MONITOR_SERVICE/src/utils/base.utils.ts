import { Request, Response, NextFunction } from 'express';
import * as yup from "yup"
import { CustomError } from '../typings/base.type';
export function GlobalErrorHandler(err:Error,req:Request,res: Response,next:NextFunction)
{   
    console.log("ROUTE:",req.url,"METHOD:",req.method)
    console.log("ERROR MESSAGE :", err.message)
    console.log("ERROR STACK :", err.stack)
    if(err instanceof yup.ValidationError)
    {
        res.status(400).json({message:err.errors})
        return 
    }
    else if (err instanceof CustomError){
        let statusCode = err.statusCode
        res.status(statusCode).json({message:err.message})
        return
    }
    else
    {   
        res.status(500).json({message:"Opps some unexpected error occured"})
        return 
    }
}