import { Router } from "express";
import { Wrapper } from "../../utility/base.utils";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticator.middleware";

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and Authorization related APIs
 *
 * /user/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Register a new user account with email and password. The password and confirmPassword must match.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Password for the new account
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Must match the password field
 *     responses:
 *       201:
 *         description: User created successfully. Email verification OTP sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: User created successfully, please verify your email
 *       400:
 *         description: Validation error or user already exists
 *
 * /user/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     description: Logs in a user with email and password, returns access and refresh tokens in cookies and JSON response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Login successful with tokens set in cookies and response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Invalid credentials or validation error
 *
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Logs out the user by invalidating the refresh token and clearing cookies.
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Missing token or invalid request
 *
 * /user/auth/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the logged-in user's details (excluding password).
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         emailVerified:
 *                           type: boolean
 *       400:
 *         description: User not found or invalid request
 *
 * /user/auth/password:
 *   patch:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Changes user's password after validating old password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect old password or validation error
 *
 * /user/auth/email:
 *   patch:
 *     summary: Change email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Change the user's email after validating password. Sends OTP for new email verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - password
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Email changed successfully, OTP sent for verification
 *       400:
 *         description: Password incorrect or email already exists
 *
 * /user/auth/verify-email:
 *   post:
 *     summary: Verify user's email via OTP
 *     tags: [Auth]
 *     description: Verifies the user's email using OTP sent on registration or email change.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user to verify
 *               otp:
 *                 type: string
 *                 description: One-time password for verification
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 * 
 * /user/auth/send-verification-mail:
 *   post:
 *     summary: Send the verification mail for email that are not verified
 *     tags: [Auth]
 *     description: Send's verification mail with otp for user to verify their mail.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 description: The Email of the user to send verification mail to.
 *     responses:
 *       200:
 *         description: Verification mail sent successfully
 
 *       400:
 *         description: Email is required
 */

const authRouter = Router();
authRouter.post("/signup", Wrapper(AuthController.signup.bind(AuthController))); // bind need to preserve the this in the class , if i had used arrow function then bind was not necessary
authRouter.post("/login", Wrapper(AuthController.login.bind(AuthController)));
authRouter.post("/logout", authenticate, Wrapper(AuthController.logout.bind(AuthController)));
authRouter.get("/profile", authenticate, Wrapper(AuthController.getUser.bind(AuthController)));
authRouter.patch("/email", authenticate, Wrapper(AuthController.changeEmail.bind(AuthController)));
authRouter.patch("/password", authenticate, Wrapper(AuthController.changePassword.bind(AuthController)));
authRouter.post("/verify-email", Wrapper(AuthController.verifyEmail.bind(AuthController)));
authRouter.get("/send-verification-mail", Wrapper(AuthController.sendVerificationMail.bind(AuthController)));
export { authRouter };
