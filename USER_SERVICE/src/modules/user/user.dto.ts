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
