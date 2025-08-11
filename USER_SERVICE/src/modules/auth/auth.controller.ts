import { Request, Response } from "express";
import {
  changeEmailValidationSchema,
  changePasswordValidationSchema,
  loginDto,
  loginValidationSchema,
  signupDto,
  signupValidationSchema,
  verifyEmailDto,
  verifyEmailValidationSchema,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import { removeCookie, setCookie } from "../../utility/base.utils";
import { AuthenticatedRequest, InvalidInputError } from "../../typings/base.typings";
import { getBrokerInstance } from "../../lib/Broker.lib";
import { GlobalSettings } from "../../globalSettings";

class AuthControllerClass {
  private userService = new AuthService();

  async signup(req: Request, res: Response) {
    let data: signupDto = await signupValidationSchema.validate(req.body);
    let message = await this.userService.signup(data);
    res.status(201).json(message);
    return;
  }

  async login(req: Request, res: Response) {
    let data: loginDto = await loginValidationSchema.validate(req.body);
    let result = await this.userService.login(data);
    setCookie(res, "refreshToken", result.data.refreshToken, 60 * 60 * 24 * 7 * 1000);
    setCookie(res, "accessToken", result.data.accessToken, 60 * 10 * 1000);
    res.status(200).json(result);
    return;
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    let message = await this.userService.logout(req.userId, req.refreshToken);
    removeCookie(res, "accessToken");
    removeCookie(res, "refreshToken");
    res.status(200).json(message);
    return;
  }

  async getUser(req: AuthenticatedRequest, res: Response) {
    let result = await this.userService.getUser(req.userId);
    res.status(200).json(result);
    return;
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    let body = await changePasswordValidationSchema.validate(req.body);
    if (!req.refreshToken) {
      throw new InvalidInputError("Refresh token is required");
    }
    let message = await this.userService.changePassword(body, req.userId, req.refreshToken);
    removeCookie(res, "accessToken");
    removeCookie(res, "refreshToken");
    res.status(200).json(message);
    return;
  }

  async changeEmail(req: AuthenticatedRequest, res: Response) {
    let body = await changeEmailValidationSchema.validate(req.body);
    let message = await this.userService.changeEmail(body, req.userId, req.refreshToken);
    removeCookie(res, "accessToken");
    removeCookie(res, "refreshToken");
    res.status(200).json(message);
    return;
  }

  // HAVE TO ADD RATE LIMIT HERE
  async verifyEmail(req: Request, res: Response) {
    let body: verifyEmailDto = await verifyEmailValidationSchema.validate(req.body);
    let result = await this.userService.verifyEmail(body.email, body.otp);
    res.status(200).json(result);
    return;
  }

  // HAVE TO ADD RATE LIMIT HERE
  async sendVerificationMail(req: Request, res: Response) {
    let body: string = req.body.email;
    if (!body) throw new InvalidInputError("Email is required");
    let result = await this.userService.sendVerificationMail(body);
    res.status(200).json(result);
    return;
  }
}

export const AuthController = new AuthControllerClass();
