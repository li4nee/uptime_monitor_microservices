import { generateOtp, isValidEmail, removeCookie, setCookie } from "../../src/utility/base.utils";

describe("baseUtils.generateOtp", () => {
  it("Should generate a random string of given length", () => {
    const length = 8;
    const randomString = generateOtp(length);
    expect(randomString).toHaveLength(length);
    expect(/^\d+$/.test(randomString)).toBe(true);
  });

  it("Should generate a random string of default length 6 when no length is provided", () => {
    const randomString = generateOtp();
    expect(randomString).toHaveLength(6);
    expect(/^\d+$/.test(randomString)).toBe(true);
  });

  it("Should generate different strings on multiple calls", () => {
    const string1 = generateOtp(10);
    const string2 = generateOtp(10);
    expect(string1).not.toBe(string2);
  });

  it("Should handle edge case of length 0", () => {
    const randomString = generateOtp(0);
    expect(randomString).toBe("");
  });

  it("Should handle large lengths", () => {
    const length = 1000;
    const randomString = generateOtp(length);
    expect(randomString).toHaveLength(length);
    expect(/^\d+$/.test(randomString)).toBe(true);
  });

  it("Should handle negative lengths by returning an empty string", () => {
    const randomString = generateOtp(-5);
    expect(randomString).toBe("");
  });
});

describe("baseUtils.isValidEmail", () => {
  it("Should validate correct email formats", () => {
    expect(isValidEmail("ram@gmail.com")).toBe(true);
    expect(isValidEmail("ram.pokharel@school.com.np")).toBe(true);
  });

  it("Should invalidate incorrect email formats", () => {
    expect(isValidEmail("ram@.com")).toBe(false);
    expect(isValidEmail("ram.com")).toBe(false);
    expect(isValidEmail("ram@com")).toBe(false);
    expect(isValidEmail("ram@com.")).toBe(false);
    expect(isValidEmail("@gmail.com")).toBe(false);
    expect(isValidEmail("ram@ gmail.com")).toBe(false);
    expect(isValidEmail("ram@gmail .com")).toBe(false);
  });
});

describe("baseUtils.setCookie", () => {
  it("Should set cookie with correct parameters", () => {
    let mockResponse = {
      cookie: jest.fn(),
    } as any;
    let name = "testCookie";
    let value = "testValue";
    let time = 60 * 60 * 1000;

    setCookie(mockResponse, name, value, time);
    expect(mockResponse.cookie).toHaveBeenCalledWith(name, value, {
      maxAge: time,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      httpOnly: true,
    });
  });

  it("Should set secure to true when in production", () => {
    process.env.NODE_ENV = "production";
    let mockResponse = {
      cookie: jest.fn(),
    } as any;
    let name = "testCookie";
    let value = "testValue";
    let time = 60 * 60 * 1000;

    setCookie(mockResponse, name, value, time);
    expect(mockResponse.cookie).toHaveBeenCalledWith(name, value, {
      maxAge: time,
      path: "/",
      secure: true,
      sameSite: "strict",
      httpOnly: true,
    });
  });
});

describe("baseUtils.removeCookie", () => {
  it("Should clear cookie with correct parameters", () => {
    let response = {
      clearCookie: jest.fn(),
    };
    let name = "testCookie";

    removeCookie(response as any, name);
    expect(response.clearCookie).toHaveBeenLastCalledWith(name, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      httpOnly: true,
    });
  });
});
