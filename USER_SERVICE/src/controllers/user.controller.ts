import { Repository } from "typeorm";
import { User } from "../entity/user.entity";
import { UserModel } from "../repo/user.repo";
import { Request,Response } from "express";
import bcrypt from 'bcrypt'
import { InvalidInputError } from "../typings/base.typings";

class UserControllerClass{

    private UserModel : Repository<User> = UserModel
    

    async signup (req:Request, res:Response):Promise<void>{
      const { email, password,confirmPassword } = req.body
      if(password!=confirmPassword)
        throw new InvalidInputError("Password and confirm password don't match")
      let oldUser = await this.UserModel.findOne({where:{email},select:{email:true,password:true}})
      if (oldUser) 
        throw new InvalidInputError("User with this mail already exists")  
      
      const hashed = await bcrypt.hash(password, 10)
      let user = new User()
      user.email= email
      user.password=hashed
      user.notification=true
      user.email
      await this.UserModel.save(user)
      res.json({message:"Us"})
      return 
    }

    async login (req:Request,res:Response)
    {

    }
    
}

export const UserController = new UserControllerClass()