import { prisma } from "../../prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  generateSignature,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { httpCodes } from "../constants.js";



const searchQuery = asyncHandler(async (req, res) => {

  let { limit = 10, query } = req.query;
  const videos=await prisma.video.findMany({
    where: {
      OR: [
        { description: { contains: query,mode:"insensitive" } },
        { title: { contains: query,mode:"insensitive" } }
        
      ]
    }
  });
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok,videos,"suggestion fetched"))

});




const getAllVideos = asyncHandler(async (req, res) => {
  let  { page = 1, limit = 10, query, sortBy, sortType, userName } = req.query;
  
  if (!(query && sortBy && sortType && userName)) {
    // throw new ApiError(httpCodes.badRequest, "required fields cannot be null");
    page = 1;
    sortBy = "createdAt";
    sortType = "desc";
    userName = req.user.userName;
  }

  const start = (page-1) * limit;
  let sort = {};

  sort[sortBy] = sortType;
  
  console.log(userName);
  
  const videos = await prisma.video.findMany({
    where: {isPublished:true},
    skip: start,
    orderBy: sort,
    take: parseInt(limit),
    include:{owner:true}
    
  });
  
  res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, videos, "all videos fectched successfully")
    );

  //TODO: get all videos based on query, sort, pagination
});


// const publishAVideo = asyncHandler(async (req, res) => {
//   const { title, description } = req.body;
//   console.log(req.files);
  
//   if (!(title.trim() && description.trim())) {
//     throw new ApiError(
//       httpCodes.badRequest,
//       "title and description are required for saving video"
//     );
//   }

//   const videoBuffer = req.files.videoFile[0].buffer;
//   const thumbnailBuffer = req.files.thumbnail[0].buffer;

//   if (!(videoBuffer && thumbnailBuffer)) {
//     throw new ApiError(
//       httpCodes.badRequest,
//       "video and thumbnail are required for uploading video"
//     );
//   }

//   const video = await uploadOnCloudinary(videoBuffer);
//   const thumbnail = await uploadOnCloudinary(thumbnailBuffer);

//   if (!(video && thumbnail)) {
//     throw new ApiError(
//       httpCodes.serverSideError,
//       "Error while uploading video/thumbnail to cloud"
//     );
//   }

//   const createdvideo = await prisma.video.create({
//     data: {
//       title,
//       description,
//       thumbnail: thumbnail.secure_url,
//       videoFile: video.secure_url,
//       thumbnailPublicId: thumbnail.public_id,
//       videoPublicId: video.public_id,
//       ownerId: req.user.id,
//       duration: video.duration || 0,
//     },
//   });

//   createdvideo.videoPublicId = createdvideo.thumbnailPublicId = undefined;
//   res
//     .status(httpCodes.created)
//     .json(
//       new ApiResponse(
//         httpCodes.created,
//         createdvideo,
//         "video uploaded succcessfully"
//       )
//     );
//   // TODO: get video, upload to cloudinary, create video
// });







const publishAVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    videoUrl,
    thumbnailUrl,
    videoPublicId,
    thumbnailPublicId,
    duration,
  } = req.body;

  if (!(title?.trim() && description?.trim())) {
    throw new ApiError(
      httpCodes.badRequest,
      "title and description are required for saving video"
    );
  }

  let finalVideoUrl = videoUrl;
  let finalThumbnailUrl = thumbnailUrl;
  let finalVideoPublicId = videoPublicId;
  let finalThumbnailPublicId = thumbnailPublicId;
  let finalDuration = duration ? parseFloat(duration) : 0;

  // Fallback to server-side upload if files are present
  if (req.files?.videoFile && req.files?.thumbnail) {
    const videoBuffer = req.files.videoFile[0].buffer;
    const thumbnailBuffer = req.files.thumbnail[0].buffer;

    const video = await uploadOnCloudinary(videoBuffer);
    const thumbnail = await uploadOnCloudinary(thumbnailBuffer);

    if (!(video && thumbnail)) {
      throw new ApiError(
        httpCodes.serverSideError,
        "Error while uploading video/thumbnail to cloud"
      );
    }

    finalVideoUrl = video.secure_url;
    finalThumbnailUrl = thumbnail.secure_url;
    finalVideoPublicId = video.public_id;
    finalThumbnailPublicId = thumbnail.public_id;
    finalDuration = video.duration || 0;
  }

  if (!(finalVideoUrl && finalThumbnailUrl)) {
    throw new ApiError(
      httpCodes.badRequest,
      "video and thumbnail are required (either as URLs or files)"
    );
  }

  const createdvideo = await prisma.video.create({
    data: {
      title,
      description,
      thumbnail: finalThumbnailUrl,
      videoFile: finalVideoUrl,
      thumbnailPublicId: finalThumbnailPublicId || "unknown",
      videoPublicId: finalVideoPublicId || "unknown",
      ownerId: req.user.id,
      duration: finalDuration,
    },
  });

  res
    .status(httpCodes.created)
    .json(
      new ApiResponse(
        httpCodes.created,
        createdvideo,
        "video uploaded succcessfully"
      )
    );
});




const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId.trim()) {
    throw new ApiError(
      httpCodes.badRequest,
      "video Id is required for getting video"
    );
  }

  let video;
  const previouslyWatched = await prisma.watchHistory.findFirst({
    where: { videoId,viewerId:req.user?.id },
    include: {
      video: {
        include: {
          owner: { include: { subscribers: true } },
          _count: { select: { likes: true } },
          likes:true
        },
      },
    },
  });
  
  if (previouslyWatched)
  {
    video = previouslyWatched.video;
    video.watchedTill = previouslyWatched.watchedTill;
  }

  else {
    video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        owner: { include: { subscribers: true } },
        _count: { select: { likes: true } },
        likes: true,
      },
    });
   
  
  }




   video.owner.subscribersCount = video.owner.subscribers.length;
   video.isSubscribed =
     video.owner.subscribers.find((s) => s.subscriberId === req.user.id) !=
     undefined;
   video.owner.subscribers = undefined;
   video.likesCount = video._count.likes;
   video._count = undefined;
   let isLiked = false;
   video.likes.map((like) => {
     if (like.ownerId === req.user.id) isLiked = true;
   });
   video.isLiked = isLiked;
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



const getAllVideosOfUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if(!userId || userId.trim()==="undefined"){throw new ApiError(httpCodes.badRequest,"userId is required and cannot  be null or undefined");}

  const videos = await prisma.video.findMany({ where: { ownerId: userId } });
  
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, videos, "videos of channel fetched successfully"));
  
});



const getVideoSuggestions = asyncHandler(async (req, res) => {
  
  const { videoId,limit=10 } = req.params;
  
  const video = await prisma.video.findUnique({ where: { id: videoId, isPublished: true } });
  
  if (!video) { throw new ApiError(httpCodes.notFound, "video doesnot exists"); }

  let suggestions = await prisma.video.findMany({ where: { ownerId: video.ownerId, isPublished: true } });
  if (!(suggestions.length > limit)) {

    let abc=await prisma.video.findMany(
      { where: { isPublished: true, ownerId: { notIn: [req.user.id] } }, take: limit - (suggestions.length + 1), orderBy: { createdAt: "desc" } });
    suggestions = [...suggestions, ...abc];
  }
  
  console.log("returning suggestions", suggestions);
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, suggestions, "suggestions fetched successfully"));
  
  
  
  
})



const getUploadSignature = asyncHandler(async (req, res) => {
  const signatureData = generateSignature();
  
  res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, signatureData, "Signature generated successfully"));
});


const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName && email)) { throw new ApiError(httpCodes.badRequest, "fullName and email both are required"); }

  const user = await prisma.user.update({ where: { id: req.user.id }, data: { fullName, email } });
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, user, "user updated successfully"));
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideosOfUser,
  getVideoSuggestions,
  searchQuery,
  getUploadSignature,
  updateUserDetails

};
