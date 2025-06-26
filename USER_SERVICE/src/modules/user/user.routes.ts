import { Router } from 'express';
import { Wrapper } from '../../utility/base.utility';
import { UserController } from './user.controller';

const userRouter = Router();

userRouter.post("/signup",Wrapper(UserController.signup.bind(UserController))) // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
userRouter.post("/login",Wrapper(UserController.login.bind(UserController)))

export {userRouter}