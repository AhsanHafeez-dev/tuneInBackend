import { prisma } from "../../prisma/index.js";
import { httpCodes } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;



    // Run all aggregation queries in parallel
    const [videoStats, subscribersCount, totalLikes] = await Promise.all([
        // 1. Get Total Views and Total Videos
        prisma.video.aggregate({ where: { ownerId: userId }, _sum: { views: true }, _count: { id: true } }),        
        // 2. Get Total Subscribers
        prisma.subscription.count({ where: { channelId: userId } }),        
        // 3. Get Total Likes on all videos (Join logic)
        prisma.like.count({where: {video: {ownerId: userId}}})
    ]);

    const channelStats = {
        totalVideos: videoStats?._count?.id,
        totalViews: videoStats?._sum?.views || 0, // Handle null if no videos exist
        subscribers: subscribersCount,
        totalLikes: totalLikes
    };

    return res
        .status(httpCodes.ok)
        .json(new ApiResponse(httpCodes.ok, channelStats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await prisma.video.findMany({ where: { ownerId: req.user.id } });
    
    return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, videos, "videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
