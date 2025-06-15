import { Router } from 'express';
import { Wrapper } from '../../utility/base.utility';
import { UserController } from './user.controller';

const router = Router();

router.post("/signup",Wrapper(UserController.signup.bind(UserController))) // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
router.post("/login",Wrapper(UserController.login.bind(UserController)))