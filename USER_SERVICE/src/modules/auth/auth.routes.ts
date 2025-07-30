import { Router } from "express";
import { Wrapper } from "../../utility/base.utils";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticator.middleware";

const authRouter = Router();
authRouter.post("/signup", Wrapper(AuthController.signup.bind(AuthController))); // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
authRouter.post("/login", Wrapper(AuthController.login.bind(AuthController)));
authRouter.post("/logout", authenticate, Wrapper(AuthController.logout.bind(AuthController)));
authRouter.get("/profile", authenticate, Wrapper(AuthController.getUser.bind(AuthController)));
authRouter.patch("/email", authenticate, Wrapper(AuthController.changeEmail.bind(AuthController)));
authRouter.patch("/password", authenticate, Wrapper(AuthController.changePassword.bind(AuthController)));
authRouter.post("/verify-email", Wrapper(AuthController.verifyEmail.bind(AuthController)));
export { authRouter };
