import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { httpCodes } from "../constants.js";
import { prisma } from "../../prisma/index.js";
// import { logger } from "../utils/logger.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // logger.info("starting auth middleware");

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.split(" ")[1] ||
      req.cookies._vercel_jwt;
    // console.log(req);
    console.log("token : ", token);
    console.log("authorization", req.header("Authorization"));
    console.log("headers ",req.header);
    
    
    
    
    if (!token) {
      throw new ApiError(httpCodes.unauthorized, "please login first");
    }
    // logger.info("valid token");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await prisma.user.findFirst({
      where: { id: decodedToken?.id },
    });
    if (!user) {
      throw new ApiError(httpCodes.unauthorized, "invalid toke");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      httpCodes.unauthorized,
      error?.message || "Invalid access Token"
    );
  }
});
