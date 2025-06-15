import { Request,Response } from "express";
import { loginDto, loginValidationSchema, signupDto, signupValidationSchema } from "./user.dto";
import { UserService } from "./user.service";
import { setCookie } from "../../utility/base.utility";

class UserControllerClass{
    private userService = new UserService();

    async signup(req:Request,res:Response)
    {
      let data : signupDto = await signupValidationSchema.validate(req.body)
      let message = await this.userService.signup(data)
      res.status(201).json(message)
      return
    }

    async login(req:Request,res:Response)
    {
      let data : loginDto = await loginValidationSchema.validate(req.body)
      let result = await this.userService.login(data)
      setCookie(res,"refreshToken",result.refreshToken,60*60*24*7)
      setCookie(res,"accessToken",result.accessToken,60*60)
      res.status(200).json(result)
      return 
    }
 
}

export const UserController = new UserControllerClass()