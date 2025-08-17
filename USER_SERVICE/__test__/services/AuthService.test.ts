import { LoginStore } from "../../src/utility/login.utils";
import bcrypt from "bcrypt";
import { AuthService } from "../../src/modules/auth/auth.service";
import { DefaultResponse, ROLE } from "../../src/typings/base.typings";
import { generateOtp } from "../../src/utility/base.utils";
import jwt from "jsonwebtoken";
import { GlobalSettings } from "../../src/globalSettings";
import * as baseUtils from "../../src/utility/base.utils";
jest.mock("bcrypt");
jest.mock("../../src/utility/login.utils", () => ({
  LoginStore: { setOtpToken: jest.fn(), setUserToken: jest.fn(), removeUserToken: jest.fn(), verifyOtpToken: jest.fn() },
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("AuthService.SignUp Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  const validSignUpData = {
    email: "nishant@gmail.com",
    password: "password123",
    confirmPassword: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      save: jest.fn(),
      findOne: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if passwords don't match", async () => {
    const invalidData = { ...validSignUpData, confirmPassword: "differentPassword" };
    await expect(authService.signup(invalidData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if user already exists", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({
      id: "123",
      password: "hashedpassword",
      email: validSignUpData.email,
      emailVerified: true,
    });
    await expect(authService.signup(validSignUpData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if email is empty", async () => {
    const invalidData = { ...validSignUpData, email: "" };
    await expect(authService.signup(invalidData)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockUserModel.save).not.toHaveBeenCalled();
    expect(mockBroker.sendEmail).not.toHaveBeenCalled();
  });

  it("Should throw error if password or confirm password is empty", async () => {
    const invalidData = { ...validSignUpData, password: "" };
    await expect(authService.signup(invalidData)).rejects.toMatchObject({
      statusCode: 400,
    });
    invalidData.password = "validPassword";
    invalidData.confirmPassword = "";
    await expect(authService.signup(invalidData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should hash password , create user and send Otp upon success", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");
    mockUserModel.save.mockResolvedValueOnce({ id: "123" });
    const res = await authService.signup(validSignUpData);

    expect(generateOtp()).toBeDefined();
    expect(mockUserModel.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: validSignUpData.email,
        password: "hashedPassword",
        emailVerified: false,
      }),
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(validSignUpData.password, 10);
    expect(LoginStore.setOtpToken).toHaveBeenCalledWith(expect.any(String), validSignUpData.email, GlobalSettings.tokensAndExpiry.OTPexpiry);
    expect(mockBroker.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: validSignUpData.email,
        subject: "Email Verification",
        text: expect.stringContaining("Your OTP for email verification is"),
        from: expect.any(String),
      }),
    );
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(201);
    expect(res.message).toBe("User created successfully, please verify your email");
    expect(res.data.email).toBe(validSignUpData.email);
  });

  it("Should throw error if broker fails to send email", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");
    mockUserModel.save.mockResolvedValueOnce({ id: "123" });
    mockBroker.sendEmail.mockRejectedValueOnce(new Error("Email service failed"));
    await expect(authService.signup(validSignUpData)).rejects.toThrow("Email service failed");
  });

  it("Should throw error if userModel fails to save", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");
    mockUserModel.save.mockRejectedValueOnce(new Error("Database error"));
    await expect(authService.signup(validSignUpData)).rejects.toThrow("Database error");
  });

  it("Should throw error if bcrypt throws error", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    bcrypt.hash = jest.fn().mockRejectedValueOnce(new Error("Bcrypt error"));
    await expect(authService.signup(validSignUpData)).rejects.toThrow("Bcrypt error");
  });

  it("Should throw error if LoginStore throws error", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    LoginStore.setOtpToken = jest.fn().mockRejectedValueOnce(new Error("LoginStore error"));
    await expect(authService.signup(validSignUpData)).rejects.toThrow("LoginStore error");
  });
});

describe("AuthService.Login Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  let validLoginData = {
    email: "nishant@gmail.com",
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      findOne: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if user does not exist", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    await expect(authService.login(validLoginData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if email is not verified", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({
      id: "123",
      email: validLoginData.email,
      password: "hashedPassword",
      emailVerified: false,
    });
    await expect(authService.login(validLoginData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if password is invalid", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({
      id: "123",
      email: validLoginData.email,
      password: "hashedPassword",
      emailVerified: true,
    });
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    await expect(authService.login(validLoginData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should generate token , set in login store and return response with access and refreshToken on successful login", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({
      id: "123",
      email: validLoginData.email,
      password: "hashedPassword",
      emailVerified: true,
    });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockImplementationOnce(() => "accessToken").mockImplementationOnce(() => "refreshToken");

    LoginStore.setuserToken = jest.fn();

    const res = await authService.login(validLoginData);

    expect(bcrypt.compare).toHaveBeenCalledWith(validLoginData.password, "hashedPassword");
    expect(jwt.sign).toHaveBeenCalledWith({ userId: "123", role: ROLE.USER, createdAt: expect.any(Number) }, expect.any(String), {
      expiresIn: expect.stringMatching(
        new RegExp(`^(${GlobalSettings.tokensAndExpiry.accessTokenExpiry}|${GlobalSettings.tokensAndExpiry.refreshTokenExpiry})$`),
      ),
    });

    expect(LoginStore.setuserToken).toHaveBeenCalledWith("refreshToken", "123", GlobalSettings.tokensAndExpiry.refreshTokenExpiryInSeconds);
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("Login successful");
    expect(res.data.accessToken).toBe("accessToken");
    expect(res.data.refreshToken).toBe("refreshToken");
  });
});

describe("AuthService.Logout Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      findOne: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if no token is provided", async () => {
    await expect(authService.logout("123")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if no userId is provided", async () => {
    await expect(authService.logout("", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should remove user token from LoginStore and return success response on successful logout", async () => {
    LoginStore.removeuserToken = jest.fn();
    const res = await authService.logout("123", "someToken");
    expect(LoginStore.removeuserToken).toHaveBeenCalledWith("123", "someToken");
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("Logout successful");
  });
});

describe("AuthService.GetUser Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      findOne: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if no userId is provided", async () => {
    await expect(authService.getUser("")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if user is not found", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    await expect(authService.getUser("123")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should return user data without password on successful retrieval", async () => {
    const mockUser = { id: "123", email: "nishant@gmail.com", password: "hashedPassword", emailVerified: true };
    mockUserModel.findOne.mockResolvedValueOnce(mockUser);
    const res = await authService.getUser("123");
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("User retrieved successfully");
    let { password, ...userWithoutPassword } = mockUser;
    expect(res.data.user).toMatchObject({ ...userWithoutPassword });
  });
});

describe("AuthService.ChangePassword Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  const validChangePasswordData = {
    oldPassword: "oldPassword123",
    newPassword: "newPassword123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });
  it("Should throw error if no userId is provided", async () => {
    await expect(authService.changePassword(validChangePasswordData, "", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if no token is provided", async () => {
    await expect(authService.changePassword(validChangePasswordData, "123", "")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if old or new password is not provided", async () => {
    const invalidData = { ...validChangePasswordData, oldPassword: "" };
    await expect(authService.changePassword(invalidData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
    invalidData.oldPassword = "oldPassword123";
    invalidData.newPassword = "";
    await expect(authService.changePassword(invalidData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if user does not exist", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    await expect(authService.changePassword(validChangePasswordData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if old password is incorrect", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedOldPassword" });
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    await expect(authService.changePassword(validChangePasswordData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error error if new password is same as old password", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedOldPassword" });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    const invalidData = { ...validChangePasswordData, newPassword: "oldPassword123" };
    await expect(authService.changePassword(invalidData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if new password is less than 6 characters", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedOldPassword" });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    const invalidData = { ...validChangePasswordData, newPassword: "short" };
    await expect(authService.changePassword(invalidData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should hash new password, update user,remove accessToken from LoginStore and return success response on successful password change", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedOldPassword" });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    bcrypt.hash = jest.fn().mockResolvedValue("hashedNewPassword");
    mockUserModel.save.mockResolvedValueOnce({ id: "123", password: "hashedNewPassword" });
    LoginStore.removeuserToken = jest.fn();
    const res = await authService.changePassword(validChangePasswordData, "123", "someToken");

    expect(bcrypt.compare).toHaveBeenCalledWith(validChangePasswordData.oldPassword, "hashedOldPassword");
    expect(bcrypt.hash).toHaveBeenCalledWith(validChangePasswordData.newPassword, 10);
    expect(mockUserModel.save).toHaveBeenCalledWith(expect.objectContaining({ id: "123", password: "hashedNewPassword" }));
    expect(LoginStore.removeuserToken).toHaveBeenCalledWith("123", "someToken");
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("Password changed successfully");
  });
});

describe("AuthService.ChangeEmail Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  const validChangeEmailData = {
    newEmail: "niraj@gmail.com",
    password: "password123",
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if no refreshToken is provided", async () => {
    await expect(authService.changeEmail(validChangeEmailData, "123")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if no userId is provided", async () => {
    await expect(authService.changeEmail(validChangeEmailData, "", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if new email or password is not provided", async () => {
    const invalidData = { ...validChangeEmailData, newEmail: "" };
    await expect(authService.changeEmail(invalidData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
    invalidData.newEmail = "niraj@gmail.com";
    invalidData.password = "";
    await expect(authService.changeEmail(invalidData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if user does not exist", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    await expect(authService.changeEmail(validChangeEmailData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if password is incorrect", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedPassword" });
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    await expect(authService.changeEmail(validChangeEmailData, "123", "someToken")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should hash new email, update user, send verification email and return success response on successful email change", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedPassword", emailVerified: true });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    mockUserModel.save.mockResolvedValueOnce({ id: "123", email: validChangeEmailData.newEmail, emailVerified: false });
    LoginStore.setOtpToken = jest.fn();
    mockBroker.sendEmail.mockResolvedValueOnce();
    const res = await authService.changeEmail(validChangeEmailData, "123", "someToken");

    expect(bcrypt.compare).toHaveBeenCalledWith(validChangeEmailData.password, "hashedPassword");
    expect(mockUserModel.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "123", email: validChangeEmailData.newEmail, emailVerified: false }),
    );
    expect(LoginStore.setOtpToken).toHaveBeenCalledWith(expect.any(String), validChangeEmailData.newEmail, GlobalSettings.tokensAndExpiry.OTPexpiry);
    expect(mockBroker.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: validChangeEmailData.newEmail,
        subject: "Email Change Verification",
        text: expect.stringContaining(`Your OTP for email change verification is`),
        from: expect.any(String),
      }),
    );
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("Email changed successfully.Please verify your email.");
  });

  it("Should throw error if broker fails to send email", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", password: "hashedPassword" });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    mockUserModel.save.mockResolvedValueOnce({ id: "123", email: validChangeEmailData.newEmail, emailVerified: false });
    mockBroker.sendEmail.mockRejectedValueOnce(new Error("Email service failed"));
    await expect(authService.changeEmail(validChangeEmailData, "123", "someToken")).rejects.toThrow("Email service failed");
  });
});

describe("AuthService.sendVerificationMail Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(baseUtils, "generateOtp").mockReturnValue("123456");
    mockUserModel = {
      findOne: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if no email is provided", async () => {
    await expect(authService.sendVerificationMail("")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if email is invalid", async () => {
    await expect(authService.sendVerificationMail("invalidEmail")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("Should throw error if user does not exist", async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    await expect(authService.sendVerificationMail("nishant@gmail.com")).rejects.toMatchObject({
      statusCode: 400,
      message: "User with this email does not exist",
    });
  });

  it("Should throw error if user email is already verified", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", email: "nishant@gmail.com", emailVerified: true });
    await expect(authService.sendVerificationMail("nishant@gmail.com")).rejects.toMatchObject({ statusCode: 400, message: "Email already verified" });
  });

  it("Should generate OTP, save it in LoginStore, send verification email and return success response on successful email verification request", async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", email: "nishant@gmail.com", emailVerified: false });
    LoginStore.setOtpToken = jest.fn();
    mockBroker.sendEmail.mockResolvedValueOnce();
    const res = await authService.sendVerificationMail("nishant@gmail.com");
    expect(generateOtp).toHaveBeenCalled();
    expect(LoginStore.setOtpToken).toHaveBeenCalledWith(expect.any(String), "nishant@gmail.com", GlobalSettings.tokensAndExpiry.OTPexpiry);
    expect(mockBroker.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "nishant@gmail.com",
        subject: "Email Verification",
        text: expect.stringContaining(`Your OTP for email verification is`),
        from: expect.any(String),
      }),
    );
    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("Verification mail sent successfully");
  });
});

describe("AuthService.VerifyEmail Tests", () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockBroker: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockBroker = {
      sendEmail: jest.fn(),
    };
    authService = new AuthService(mockUserModel, mockBroker);
  });

  it("Should throw error if email or OTP is not provided or Email is not valid", async () => {
    await expect(authService.verifyEmail("", "123456")).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(authService.verifyEmail("nishant@gmail.com", "")).rejects.toMatchObject({ statusCode: 400 });
    await expect(authService.verifyEmail("invalidEmail", "123456")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("Should throw error if otp is invalid", async () => {
    LoginStore.verifyOtpToken = jest.fn().mockResolvedValueOnce(false);
    await expect(authService.verifyEmail("nishant@gmail.com", "123456")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("Should throw error if user does not exist", async () => {
    LoginStore.verifyOtpToken = jest.fn().mockResolvedValueOnce(true);
    mockUserModel.findOne.mockResolvedValueOnce(null);
    await expect(authService.verifyEmail("nishant@gmail.com", "123456")).rejects.toMatchObject({ statusCode: 400, message: "User not found" });
  });

  it("Should update user emailVerified status, remove OTP from LoginStore, send success email and return success response on successful email verification", async () => {
    LoginStore.verifyOtpToken = jest.fn().mockResolvedValueOnce(true);
    mockUserModel.findOne.mockResolvedValueOnce({ id: "123", email: "nishant@gmail.com", emailVerified: false });
    mockUserModel.save.mockResolvedValueOnce({ id: "123", email: "nishant@gmail.com", emailVerified: true });
    LoginStore.removeOtpToken = jest.fn();
    mockBroker.sendEmail.mockResolvedValueOnce();

    const res = await authService.verifyEmail("nishant@gmail.com", "123456");

    expect(LoginStore.verifyOtpToken).toHaveBeenCalledWith("nishant@gmail.com", "123456");
    expect(mockUserModel.save).toHaveBeenCalledWith(expect.objectContaining({ id: "123", emailVerified: true }));
    expect(LoginStore.removeOtpToken).toHaveBeenCalledWith("nishant@gmail.com", "123456");

    expect(res).toBeDefined();
    expect(res).toBeInstanceOf(DefaultResponse);
    expect(res.status).toBe(200);
    expect(res.message).toBe("Email verified successfully");
  });
});
