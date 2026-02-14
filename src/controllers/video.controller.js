import { prisma } from "../../prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { httpCodes } from "../constants.js";


const getAllVideos = asyncHandler(async (req, res) => {
  let  { page = 1, limit = 10, query, sortBy, sortType, userName } = req.query;
  
  if (!(query && sortBy && sortType && userName)) {
    // throw new ApiError(httpCodes.badRequest, "required fields cannot be null");
    page = 1;
    sortBy = "views";
    sortType = "desc";
    userName = req.user.userName;
  }

  const start = (page-1) * limit;
  let sort = {};

  sort[sortBy] = sortType;
  
  console.log(userName);
  
  const videos = await prisma.video.findMany({
    where: {
      
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { owner: { userName } },
        {owner:{fullName:userName}}
      ],
      isPublished:true
    },
    skip: start,
    orderBy: sort,
    take: parseInt(limit),
    
  });
  
  res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, videos, "all videos fectched successfully")
    );

  //TODO: get all videos based on query, sort, pagination
});


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  console.log(req.files);
  
  if (!(title.trim() && description.trim())) {
    throw new ApiError(
      httpCodes.badRequest,
      "title and description are required for saving video"
    );
  }

  const videoBuffer = req.files.videoFile[0].buffer;
  const thumbnailBuffer = req.files.thumbnail[0].buffer;

  if (!(videoBuffer && thumbnailBuffer)) {
    throw new ApiError(
      httpCodes.badRequest,
      "video and thumbnail are required for uploading video"
    );
  }

  const video = await uploadOnCloudinary(videoBuffer);
  const thumbnail = await uploadOnCloudinary(thumbnailBuffer);

  if (!(video && thumbnail)) {
    throw new ApiError(
      httpCodes.serverSideError,
      "Error while uploading video/thumbnail to cloud"
    );
  }

  const createdvideo = await prisma.video.create({
    data: {
      title,
      description,
      thumbnail: thumbnail.secure_url,
      videoFile: video.secure_url,
      thumbnailPublicId: thumbnail.public_id,
      videoPublicId: video.public_id,
      ownerId: req.user.id,
      duration: video.duration || 0,
    },
  });

  createdvideo.videoPublicId = createdvideo.thumbnailPublicId = undefined;
  res
    .status(httpCodes.created)
    .json(
      new ApiResponse(
        httpCodes.created,
        createdvideo,
        "video uploaded succcessfully"
      )
    );
  // TODO: get video, upload to cloudinary, create video
});


const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId.trim()) {
    throw new ApiError(
      httpCodes.badRequest,
      "video Id is required for getting video"
    );
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    throw new ApiError(httpCodes.notFound, "video with this Id doesnot exist");
  }
  res
    .status(httpCodes.ok)
    .json(new ApiResponse(httpCodes.ok, video, "video fetched successfully"));

  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!videoId) {
    throw new ApiError(
      httpCodes.badRequest,
      "videoId is required for updation"
    );
  }

  const thumbnailBuffer = req.file.buffer;

  let thumbnail, thumbnailPublicId;
  const video = await prisma.video.findUnique({ where: { id: videoId } });

  if (!video) {
    throw new ApiError(httpCodes.notFound, "Video not found");
  }

  if (thumbnailBuffer) {
    thumbnail = await uploadOnCloudinary(thumbnailBuffer);
    thumbnailPublicId = thumbnail.public_id;
    thumbnail = thumbnail.secure_url;
  }

  if (!thumbnail) {
    thumbnail = video.thumbnail;
    thumbnailPublicId = video.thumbnailPublicId;
  } else {
    deleteFromCloudinary(video.thumbnailPublicId);
  }

  if (!title.trim()) {
    title = video.title;
  }
  if (!description.trim()) {
    description = video.description;
  }

  const updatedVideo=await prisma.video.update({
    where: { id: videoId },
    data: { thumbnail, thumbnailPublicId, title, description },
  });
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, updatedVideo, "video updated successfully"));

  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(
      httpCodes.badRequest,
      "videoId is required for deleteion"
    );
  }

  const video = await prisma.video.delete({ where: { id: videoId } });
  if (!video) {
    throw new ApiError(httpCodes.notFound, "Video not found");
  }

  await deleteFromCloudinary(video.videoPublicId);
  await deleteFromCloudinary(video.thumbnailPublicId);

  res
    .status(httpCodes.noContent)
    .json(
      new ApiResponse(httpCodes.noContent, {}, "video Deleted Successfully")
    );

  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(httpCodes.badRequest, "videoId is required for toggle");
  }

  let video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    throw new ApiError(httpCodes.notFound, "Video not found");
  }

  video = await prisma.video.update({
    where: { id: videoId },
    data: { isPublished: !video.isPublished },
  });
  if (!video) {
    throw new ApiError(httpCodes.serverSideError, "error while toggling video");
  }

  res
    .status(httpCodes.ok)
    .json(new ApiResponse(httpCodes.ok, video, "Toggled Successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
