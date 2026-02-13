import { prisma } from "../../prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import {httpCodes} from "../constants.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
   
  if (!videoId) { throw new ApiError(httpCodes.badRequest, "videoId is required for toggling like on it"); }
  let like;
  try  
  { like = await prisma.like.delete({ where: { videoId } });}
    
    catch(err) {
        await prisma.like.create({ data: { videoId, ownerId: req.user.id } });
        return res.status(httpCodes.created).json(new ApiResponse(httpCodes.created, like, "like added successfully"));        
    }
    return res.status(httpCodes.noContent).json(new ApiResponse(httpCodes.noContent, {}, "like deleted successfully"));

    

  //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    
    if (!commentId) { throw new ApiError(httpCodes.badRequest, "commentId is required for toggling like on it"); }
  let like;
  
  try{ like = await prisma.like.delete({ where: { commentId } });}
    
    catch(err){
        await prisma.like.create({ data: { commentId, ownerId: req.user.id } });
        return res.status(httpCodes.created).json(new ApiResponse(httpCodes.created, like, "like added successfully"));        
    }
    return res.status(httpCodes.noContent).json(new ApiResponse(httpCodes.noContent, {}, "like deleted successfully"));

  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    
    if (!tweetId) { throw new ApiError(httpCodes.badRequest, "tweetId is required for toggling like on it"); }
  let like;  
  try { like = await prisma.like.deleteMany({ where: { tweetId } }); }
    
    catch(err){
        await prisma.like.create({ data: { tweetId, ownerId: req.user.id } });
        return res.status(httpCodes.created).json(new ApiResponse(httpCodes.created, like, "like added successfully"));        
    }
    return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, {}, "like deleted successfully"));

  //TODO: toggle like on tweet
});



const getLikedVideos = asyncHandler(async (req, res) => {

    let videos = await prisma.like.findMany({ where: { ownerId: req.user.id, videoId: { not: null } }, include: { video: true } })
    videos = videos.map((prevItem) => prevItem.video)
    
    return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, videos, "liked videos fetched successfully"));
    
  //TODO: get all liked videos
});


export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
