import { Repository } from "typeorm"
import { loginDto, signupDto } from "./user.dto"
import { User } from "../../entity/user.entity"
import { UserModel } from "../../repo/user.repo"
import { InvalidInputError } from "../../typings/base.typings"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { GlobalSettings } from "../../globalSettings"
import { LoginStore } from "../../utility/login.utility"

export class UserService{
    private UserModel : Repository<User> = UserModel
    
    async signup (body:signupDto){
      if(body.password!=body.confirmPassword)
        throw new InvalidInputError("Password and confirm password don't match")
      let oldUser = await this.checkIfUserExistsAndReturnUser(body.email,"email")
      if (oldUser) 
        throw new InvalidInputError("User with this mail already exists")    
      const hashed = await bcrypt.hash(body.password, 10)
      let user = new User()
      user.email= body.email
      user.password=hashed
      user.notification=true
      user.emailVerified=false
      await this.UserModel.save(user)
      return {message:"Signup successful. Please verify your email."}
    }

    async login(body:loginDto)
    {
      let user = await this.checkIfUserExistsAndReturnUser(body.email,"email")
      if(!user)
        throw new InvalidInputError("User with this email does not exist")
      const isPasswordValid = await bcrypt.compare(body.password, user.password)
      if(!isPasswordValid)
        throw new InvalidInputError("Invalid password")
      const accessToken = this.generateToken(user.id);
      const refreshToken = this.generateToken(user.id,"7d");
      LoginStore.setuserToken(refreshToken,user.id,60*60*24*7)
      return {message:"Login successful", accessToken, refreshToken}
    }

    async logout(userId: string, token: string) {
      const removed = await LoginStore.removeuserToken(userId, token);
      return { message: "Logout successful" };
    }

    private async checkIfUserExistsAndReturnUser(data: string, type: "email" | "id") {
      const whereClause = type === "email" ? { email: data } : { id: data }
      const user = await this.UserModel.findOne({where: whereClause,select: { id: true }})
      return user;
    }

    private generateToken(userId: string,expiresIn: jwt.SignOptions["expiresIn"]="1h") {
      const token = jwt.sign({ id: userId },GlobalSettings.JWT_SECRET as string,{expiresIn});
      return token;
    } 

}