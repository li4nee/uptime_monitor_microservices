import * as yup from "yup";

export interface loginDto {
  email: string;
  password: string;
}

export interface signupDto extends loginDto {
  confirmPassword: string;
}

export const loginValidationSchema = yup
  .object()
  .shape({
    email: yup.string().email().required(),
    password: yup.string().min(8).required(),
  })
  .noUnknown();

export const signupValidationSchema = loginValidationSchema
  .shape({
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Confirm password must match with password")
      .required(),
  })
  .noUnknown();

export interface changePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export const changePasswordValidationSchema = yup
  .object()
  .shape({
    oldPassword: yup.string().min(8).required(),
    newPassword: yup.string().min(8).required(),
  })
  .noUnknown();

export interface changeEmailDto {
  newEmail: string;
  password: string;
}

export const changeEmailValidationSchema = yup
  .object()
  .shape({
    newEmail: yup.string().email().required(),
    password: yup.string().min(8).required(),
  })
  .noUnknown();

export interface verifyEmailDto {
  otp: string;
  email: string;
}

export const verifyEmailValidationSchema = yup
  .object()
  .shape({
    otp: yup.string().length(6, "OTP must be 6 digits long").required(),
    email: yup.string().required().email(),
  })
  .noUnknown();

export const sendVerificationMailValidationSchema = yup
  .object()
  .shape({
    email: yup.string().required().email(),
  })
  .noUnknown();
