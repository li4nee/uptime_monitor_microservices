import { Repository } from "typeorm";
import { changeEmailDto, changePasswordDto, loginDto, signupDto } from "./auth.dto";
import { User } from "../../entity/user.entity";
import { UserModel } from "../../repo/user.repo";
import { DefaultResponse, InvalidInputError, ROLE } from "../../typings/base.typings";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { GlobalSettings } from "../../globalSettings";
import { LoginStore } from "../../utility/login.utility";
import { getBrokerInstance } from "../../lib/Broker.lib";
import { generateOtp } from "../../utility/base.utility";

export class AuthService {
  private userModel = UserModel;
  private broker = getBrokerInstance();

  async signup(body: signupDto) {
    if (body.password != body.confirmPassword) throw new InvalidInputError("Password and confirm password don't match");
    let oldUser = await this.checkIfUserExistsAndReturnUser(body.email, "email");
    if (oldUser) throw new InvalidInputError("User with this mail already exists");
    const hashed = await bcrypt.hash(body.password, 10);
    let user = new User();
    user.email = body.email;
    user.password = hashed;
    user.emailVerified = false;
    await this.userModel.save(user);
    let OTP = generateOtp();
    const mailData = {
      to: body.email,
      from: GlobalSettings.mail.from,
      subject: "Email Verification",
      text: `Your OTP for email verification is ${OTP}`,
    };
    await Promise.all([LoginStore.setOtpToken(user.id, OTP, 60 * 5 * 1000), this.broker.sendEmail(mailData)]);
    return new DefaultResponse(201, "User created successfully, please verify your email");
  }

  async login(body: loginDto) {
    // check if email is verified
    let user = await this.checkIfUserExistsAndReturnUser(body.email, "email");
    if (!user) throw new InvalidInputError("User with this email does not exist");
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) throw new InvalidInputError("Invalid password");
    const accessToken = this.generateToken(user.id, ROLE.USER, "2m");
    const refreshToken = this.generateToken(user.id, ROLE.USER, "7d");
    LoginStore.setuserToken(refreshToken, user.id, 60 * 60 * 24 * 7);
    return new DefaultResponse(200, "Login successful", {
      accessToken,
      refreshToken,
    });
  }

  async logout(userId: string, token?: string) {
    if (!token) throw new InvalidInputError("No token provided for logout");
    if (!userId) throw new InvalidInputError("No user ID provided for logout");
    await LoginStore.removeuserToken(userId, token);
    return new DefaultResponse(200, "Logout successful");
  }

  async getUser(userId: string) {
    if (!userId) throw new InvalidInputError("No user ID provided");
    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) throw new InvalidInputError("User not found");
    const { password, ...userWithoutPassword } = user;
    return new DefaultResponse(200, "User retrieved successfully", { user: userWithoutPassword });
  }

  async changePassword(body: changePasswordDto, userId: string) {
    if (!userId) throw new InvalidInputError("No user ID provided");
    let user = await this.checkIfUserExistsAndReturnUser(userId, "id");
    if (!user) throw new InvalidInputError("User not found");
    const isOldPasswordValid = await bcrypt.compare(body.oldPassword, user.password);
    if (!isOldPasswordValid) throw new InvalidInputError("Old password is incorrect");
    const hashedNewPassword = await bcrypt.hash(body.newPassword, 10);
    user.password = hashedNewPassword;
    await this.userModel.save(user);
    return new DefaultResponse(200, "Password changed successfully");
  }

  async changeEmail(body: changeEmailDto, userId: string) {
    if (!userId) throw new InvalidInputError("No user ID provided");
    let user = await this.checkIfUserExistsAndReturnUser(userId, "id");
    if (!user) throw new InvalidInputError("User not found");
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) throw new InvalidInputError("Password is incorrect");
    const emailExists = await this.checkIfUserExistsAndReturnUser(body.newEmail, "email");
    if (emailExists) throw new InvalidInputError("Email already exists");
    user.email = body.newEmail;
    await this.userModel.save(user);
    return new DefaultResponse(200, "Email changed successfully");
  }

  async verifyEmail(userId: string, otp: string) {
    if (!userId) throw new InvalidInputError("No user ID provided");
    if (!otp) throw new InvalidInputError("No OTP provided");
    const isOtpValid = await LoginStore.verifyOtpToken(userId, otp);
    if (!isOtpValid) throw new InvalidInputError("Invalid or expired OTP");
    let user = await this.userModel.findOne({ where: { id: userId }, select: { id: true, emailVerified: true } });
    if (!user) throw new InvalidInputError("User not found");
    user.emailVerified = true;
    await this.userModel.save(user);
    await LoginStore.removeOtpToken(userId, otp);
    return new DefaultResponse(200, "Email verified successfully");
  }

  private async checkIfUserExistsAndReturnUser(data: string, type: "email" | "id") {
    const whereClause = type === "email" ? { email: data } : { id: data };
    const user = await this.userModel.findOne({
      where: whereClause,
      select: { id: true, password: true, email: true },
    });
    return user;
  }

  private generateToken(userId: string, role: ROLE, expiresIn: jwt.SignOptions["expiresIn"] = "2m") {
    const token = jwt.sign({ userId, role, createdAt: Date.now() }, GlobalSettings.JWT_SECRET as string, { expiresIn });
    return token;
  }
}
