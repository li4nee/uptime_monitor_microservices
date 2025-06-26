import { Router } from 'express';


const monitorRouter = Router();

// monitorRouter.post("/signup",Wrapper(UserController.signup.bind(UserController))) // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
// monitorRouter.post("/login",Wrapper(UserController.login.bind(UserController)))

export {monitorRouter}