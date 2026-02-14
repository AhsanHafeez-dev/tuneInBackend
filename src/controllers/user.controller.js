import { httpCodes, secureCookieOptions } from "../constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../../prisma/index.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  encryptPassword,
  isPasswordCorrect,
  generateAccessAndRefreshToken,
} from "../utils/UserUtilities.js";
import { sendRegistrationEmail } from "../utils/Notification.js";
// import { logger } from "../utils/logger.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  // logger.info(`request from ${req.ip}`);

  let { userName, fullName, email, password } = req.body;
  const conditions = [userName, fullName, password, email];
  // const conditions = [!userName, !fullName, !password, !email];

  if (!conditions.every((el, idx) => el)) {
    // throw new ApiError(httpCodes.badRequest, "Required Fields cannot be empty");
    return res
      .status(httpCodes.badRequest)
      .json(
        new ApiResponse(
          httpCodes.badRequest,
          {},
          "Require fileds cannot be empty"
        )
      );
  }

  const userExists = await prisma.user.findFirst({
    where: {
      OR: [{ userName }, { email }],
    },
  });

  if (userExists) {
    throw new ApiError(httpCodes.conflict, "User Already exists");
  }

  // logger.info("Registering ", email);

  const avatarBuffer = req.files?.avatar[0]?.buffer;
  let coverImageBuffer;
  if (req.files?.coverImage) {
    coverImageBuffer = req.files?.coverImage[0]?.buffer;
  }

  if (!avatarBuffer) {
    throw new ApiError(
      httpCodes.badRequest,
      "avatar is required for registration"
    );
  }
  let avatar = await uploadOnCloudinary(avatarBuffer);
  console.log(avatar);
  
  
  if (!avatar) {
    throw new ApiError(
      httpCodes.serverSideError,
      "cannot upload avatar image to cloudinary"
    );
  }

  let coverImage;
  if (coverImageBuffer) {
    coverImage = await uploadOnCloudinary(coverImageBuffer);
  }

  password = await encryptPassword(password);

  const createdUser = await prisma.user.create({
    data: {
      userName: userName.toLowerCase(),
      email,
      password,
      fullName,
      coverImage: coverImage?.secure_url || "",
      avatar: avatar.secure_url,
      avatarPublicId: avatar.public_id,
      coverImagePublicId: coverImage?.public_id || "",
    },
  });

  if (!createdUser) {
    throw new ApiError(
      httpCodes.serverSideError,
      "Error while  saving to database"
    );
  }

  // sendRegistrationEmail(createdUser);

  createdUser.password = createdUser.authUrl = createdUser.otp = undefined;

  res
    .status(httpCodes.created)
    .json(
      new ApiResponse(
        httpCodes.created,
        createdUser,
        "User created successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // logger.info("login user called");
  const { userName, email, password } = req.body;
  // logger.info(`${email} ${password}`);
  if (!(userName || email)) {
    throw new ApiError(
      httpCodes.badRequest,
      "both username and email cannot be null"
    );
  }
  if (!password || password.length < 3) {
    throw new ApiError(httpCodes.badRequest, "Invalid password");
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ userName }, { email }] },
  });
  if(!user){throw new ApiError(httpCodes.notFound,"user doesnot exists")}
  // logger.info(`${(user?.password, password)}`);
  const passwordCoreect = await isPasswordCorrect(user.password, password);
  if (!passwordCoreect) {
    throw new ApiError(httpCodes.unauthorized, "Invalid credentials");
  }
  // logger.info("password checked");

  const { accesssToken, refreshToken } =
    await generateAccessAndRefreshToken(user);
  // logger.info(accesssToken);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res
    .cookie("accessToken", accesssToken, secureCookieOptions)
    .cookie("refreshToken", refreshToken, secureCookieOptions)
    .status(httpCodes.ok)
    .json(
      new ApiResponse(
        httpCodes.ok,
        { accesssToken, refreshToken, user },
        "successfully logged in"
      )
    );
});


const logoutUser = asyncHandler(async (req, res) => {
  // logger.info("starting to logout");
  const user = req.user;

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: "" },
  });

  res
    .status(httpCodes.noContent)
    .clearCookie("accessToken", secureCookieOptions)
    .clearCookie("refreshToken", secureCookieOptions)
    .json(new ApiResponse(httpCodes.noContent, {}, "loggedd out sucessfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(httpCodes.unauthorized, "Invalid refresh Token");
  }

  const decodedToken = await jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await prisma.user.findUnique({
    where: { id: decodedToken?.id },
  });

  if (!user) {
    throw new ApiError(httpCodes.unauthorized, "Invalid refreshToken");
  }
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(httpCodes.unauthorized, "Invalid token");
  }

  const { accesssToken, refreshToken } =
    await generateAccessAndRefreshToken(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res
    .status(httpCodes.created)
    .cookie("accessToken", accesssToken, secureCookieOptions)
    .cookie("refreshToken", refreshToken, secureCookieOptions)
    .json(
      new ApiResponse(
        httpCodes.created,
        { user, accesssToken, refreshToken },
        "successfully generated new tokens"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  let { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 3) {
    throw new ApiError(httpCodes.badRequest, "Invalid new passowrd");
  }

  const user = req.user;

  const passwordCorrect = await isPasswordCorrect(
    user.password,
    currentPassword
  );

  if (!passwordCorrect) {
    throw new ApiError(httpCodes.unprocessableEntity, "Incorrect password");
  }
  newPassword = await encryptPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: newPassword },
  });
  res
    .status(httpCodes.noContent)
    .json(
      new ApiResponse(httpCodes.noContent, {}, "password updated successfully")
    );
});


const getCurrentUser = asyncHandler((req, res) => {
  const user = req.user;
  user.password = user.authUrl = user.otp = undefined;

  res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(
        httpCodes.ok,
        { user },
        "current user fetched successfully"
      )
    );
});



const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarBuffer = req.file?.buffer;
  if (!avatarBuffer) {
    throw new ApiError(httpCodes.badRequest, "Avatar is required");
  }
  let user = req.user;

  const avatar = await uploadOnCloudinary(avatarBuffer);
  if (!avatar?.secure_url) {
    throw new ApiError("Error Uploading to cloud");
  }
  console.log(avatar);
  console.log(avatar+"");
  
  const publicId = user.avatarPublicId;
  user = await prisma.user.update({
    where: { id: user.id },
    data: { avatar: avatar.secure_url, avatarPublicId: avatar.public_id },
  });

  await deleteFromCloudinary(publicId);

  user.password = user.authUrl = user.otp = undefined;
  res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, { user }, "succcessfully updated avatar")
    );
});



const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageBuffer = req.file?.buffer;
  if (!coverImageBuffer) {
    throw new ApiError(httpCodes.badRequest, "coverImage is required");
  }
  let user = req.user;

  const coverImage = await uploadOnCloudinary(coverImageBuffer);
  if (!coverImage) {
    throw new ApiError("Error Uploading to cloud");
  }
  const needDeletion = user.coverImage.trim() != "";
  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      coverImage: coverImage.secure_url,
      coverImagePublicId: coverImage.public_id,
    },
  });
  if (needDeletion) {
    await deleteFromCloudinary(user.coverImagePublicId);
  }

  user.password = user.authUrl = user.otp = undefined;
  res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(
        httpCodes.ok,
        { user },
        "succcessfully updated coverImage"
      )
    );
});



const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(httpCodes.badRequest, "channel name is required");
  }

  const channel = await prisma.user.findFirst({
    where: { userName },
    select: {
      coverImage: true,
      avatar: true,
      userName: true,
      _count: { select: { subscribedChannels: true, subscribers: true } },
      subscribers: {
        where: { subscriberId: req.user?.id },
        select: { subscriberId: true },
      },
    },
  });
  if (!channel) {
    throw new ApiError(httpCodes.notFound, "channel doesnot exists");
  }

  channel.isSubscribed = channel.subscribers.length > 0;
  channel.subscribers = channel._count.subscribers;
  channel.subscribedChannels = channel._count.subscribedChannels;
  channel._count = undefined;

  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, channel, "channe; fetched successfull")
    );
});



const getWatchHistory = asyncHandler(async (req, res) => {
  const history = await prisma.watchHistory.findMany({
    where: { viewerId: req.user?.id },
    include: {
      video: {
        include: {
          owner: {
            select: {
              userName: true,
              avatar: true,
              _count: { select: { subscribers: true } },
            },
          },
        },
      },
    },
  });

  const watchHistory = history.map((historyItem) => ({
    id: historyItem.videoId,
    title: historyItem.video.title,
    thumbnail: historyItem.video.thumbnail,
    views: historyItem.video.views,
    duration: historyItem.video.duration,
    description: historyItem.video.description,
    owner: {
      userName: historyItem.video.owner.userName,
      avatar: historyItem.video.owner.avatar,
      subscrbers: historyItem.video.owner._count.subscribers,
    },
    watchedAt: historyItem.watchedAt,
    progress: historyItem.watchedTill,
    createdAt:historyItem.watchedAt
  }));

  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(
        httpCodes.ok,
        watchHistory,
        "watch History fetched successfully"
      )
    );
});


const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) { throw new ApiError(httpCodes.notFound, "video with this id doesnot exists"); }
  
  const alreadyAdded = await prisma.watchHistory.findFirst({ where: { videoId } });
  if(alreadyAdded){return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok,{watched:alreadyAdded},"already added"))}
  
  const watched = await prisma.watchHistory.create({ data: { viewerId: req.user.id, videoId } });
  return res.status(httpCodes.created).json(new ApiResponse(httpCodes.created, watched, "video added to watch History"));
})


const updateVideoWatchTime = asyncHandler(async (req, res) => {
  const { videoId, watchTime = 5 } = req.body;

  try { const updated = await prisma.watchHistory.update({ where: { videoId }, data: { watchedTill: { increment: watchTime } } }); }
  catch (err) { throw new ApiError(httpCodes.badRequest, "video with this id doesnot exists or db is not working"); }
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, {}, "suucessfully updated watch Time"));
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  addVideoToWatchHistory,
  updateVideoWatchTime
};
