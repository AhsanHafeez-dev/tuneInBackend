import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler.js";

const encryptPassword = async (password) => await bcrypt.hash(password, 10);
const isPasswordCorrect = async (orignalPassword, givenPassword) =>
  await bcrypt.compare(givenPassword, orignalPassword);
const generateAccessToken = async ({ id, email, userName, fullName }) => {
  return jwt.sign(
    { id, email, userName, fullName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = async ({ id }) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

const generateOtp = () => {
  return 123;
};

const generateAccessAndRefreshToken = async (user) => {
  const accesssToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  return { accesssToken, refreshToken };
};

const checkRefrehToken = asyncHandler(async (user, givenToken) => {
  const decodedToken = await jwt.verify(
    givenToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decodedToken) return false;

  return decodedToken === user.refreshToken;
});
export {
  encryptPassword,
  isPasswordCorrect,
  generateAccessAndRefreshToken,
  generateOtp,
};
