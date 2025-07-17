import { Router } from 'express';
import { Wrapper } from '../../utility/base.utility';
import { UserController } from './user.controller';

const authRouter = Router();

authRouter.post("/signup",Wrapper(UserController.signup.bind(UserController))) // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
authRouter.post("/login",Wrapper(UserController.login.bind(UserController)))

export {authRouter}