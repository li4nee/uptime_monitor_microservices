import { Router } from "express";
import { Wrapper } from "../../utility/base.utility";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticator.middleware";

const authRouter = Router();

authRouter.post("/signup", Wrapper(AuthController.signup.bind(AuthController))); // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
authRouter.post("/login", Wrapper(AuthController.login.bind(AuthController)));
authRouter.post("/logout", authenticate, Wrapper(AuthController.logout.bind(AuthController)));

export { authRouter };
