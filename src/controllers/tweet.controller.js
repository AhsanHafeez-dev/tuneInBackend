    // import { prisma } from "../../prisma/index.js";
    // import { ApiError } from "../utils/ApiError.js";
    // import { ApiResponse } from "../utils/ApiResponse.js";
    // import { asyncHandler } from "../utils/asyncHandler.js";
    // import {httpCodes } from "../constants.js";
    // import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"



    // const createTweet = asyncHandler(async (req, res) => {
    //     const { content } = req.body;
        
    //     if (!content) { throw new ApiError(httpCodes.badRequest, "content is required for tweet"); }
        
    //     let tweet = await prisma.tweet.create({ data: { content, ownerId: req.user.id } });
    //     if (!tweet) { throw new ApiError(httpCodes.serverSideError, "Errro while saving to database"); }

    //     if (req.files) {
    //         const uploaded=[]
    //         try {
    //             const promises=req.files.map(
    //             async (file) => {
    //                 let url = await uploadOnCloudinary(file.buffer);
    //                 uploaded.push(url?.public_id);
    //                 await prisma.tweetMedia.create({ data: { tweetId: tweet.id, url: url.url, publicId: url.public_id } });
                           
    //             }
    //         );
    //         await Promise.all(promises);
    //         }
    //         catch (err) {
    //             await prisma.tweet.delete({ where: { id: tweet.id } });
    //             await Promise.all(uploaded.map(async (publicId)=>await deleteFromCloudinary(publicId)))
    //             throw new ApiError(httpCodes.serverSideError, "error while uploading to cloud or db");
    //         }
    //     }
        
    //     tweet = await prisma.tweet.findUnique({ where: { id: tweet.id }, include: { multimedia: true } });
    //     return res.status(httpCodes.created).json(new ApiResponse(httpCodes.created, tweet, "tweet Created Successfully"));

    // //TODO: create tweet
    // });

    // const getUserTweets = asyncHandler(async (req, res) => {
    //     // TODO: get user tweets
    //     const { userId } = req.params;
    //     // 0 based indexing
    //     const { page = 1, limit = 10 } = req.body;
    //     const tweets = await prisma.tweet.findMany({ where: { ownerId: userId }, include: { multimedia: true },orderBy:{createdAt:"desc"},take:10,skip:page*limit });
    //     return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, tweets, "tweets fetched successfully"));
    // });

    // const updateTweet = asyncHandler(async (req, res) => {
    //     const { tweetId } = req.params;
    //     const { content } = req.body;
        
    //     if (!(tweetId && content)) { throw new ApiError(httpCodes.badRequest, "tweetId and content in required for updation"); }

    //     let tweet = await prisma.tweet.findUnique({ where: { id: tweetId } });

    //     if (!tweet) { throw new ApiError(httpCodes.notFound, "tweet not found or you dont own it "); }
    //     if (!(tweet.ownerId === req.user.id)) { throw new ApiError(httpCodes.forbidden, "you cannoy update other user's tweet"); }
         
    //     tweet = await prisma.tweet.update({ where: { id: tweetId }, data: { content }, include: { multimedia: true } });

    //     return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, tweet, "tweet updated successfully"));

    // //TODO: update tweet Dont allow user to change multimedia
    // });

    // const deleteTweet = asyncHandler(async (req, res) => {
    //     const { tweetId } = req.params;

    //     const tweet = await prisma.tweet.findFirst({ where: { id: tweetId }, include: { multimedia: true } });
    //     if (!tweet) { throw new ApiError(httpCodes.notFound, "tweet not found "); }

    //     if (!(tweet.ownerId === req.user.id)) { throw new ApiError(httpCodes.forbidden, "you cannot deleted other person's tweets"); }

    //     const promises = tweet.multimedia.map((media) => deleteFromCloudinary(media.publicId));
    //     await Promise.all(promises);
    //     await prisma.tweet.delete({ where: { id: tweetId } });

    //     return res.status(httpCodes.noContent).send()
    // //TODO: delete tweet
    // });

    // export { createTweet, getUserTweets, updateTweet, deleteTweet };

    

import { prisma } from "../../prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpCodes } from "../constants.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(httpCodes.badRequest, "Content is required for tweet");
  }

  // 1. Create the Tweet parent record first
  let tweet = await prisma.tweet.create({
    data: {
      content,
      ownerId: req.user.id,
    },
  });

  if (!tweet) {
    throw new ApiError(
      httpCodes.serverSideError,
      "Error while saving to database"
    );
  }

  // 2. Handle File Uploads with Rollback Support
  if (req.files && req.files.length > 0) {
    const uploadedPublicIds = []; // Track successful uploads for potential rollback

    try {
      const uploadPromises = req.files.map(async (file) => {
        const cloudRes = await uploadOnCloudinary(file.buffer);

        if (!cloudRes?.secure_url) {
          throw new Error("Cloudinary upload failed");
        }

        uploadedPublicIds.push(cloudRes.public_id);

        
        return {
          tweetId: tweet.id,
          url: cloudRes.secure_url,
          publicId: cloudRes.public_id,
        };
      });

      const mediaData = await Promise.all(uploadPromises);

      
      await prisma.tweetMedia.createMany({
        data: mediaData,
      });
    } catch (err) {
      // ROLLBACK: Delete the tweet and any images that succeeded before the error
      await prisma.tweet.delete({ where: { id: tweet.id } });

      if (uploadedPublicIds.length > 0) {
        await Promise.all(
          uploadedPublicIds.map((id) => deleteFromCloudinary(id))
        );
      }

      throw new ApiError(
        httpCodes.serverSideError,
        "Error while uploading media. Transaction rolled back."
      );
    }
  }

  
  const finalTweet = await prisma.tweet.findUnique({
    where: { id: tweet.id },
    include: { multimedia: true },
  });

  return res
    .status(httpCodes.created)
    .json(
      new ApiResponse(
        httpCodes.created,
        finalTweet,
        "Tweet Created Successfully"
      )
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  
  const skip = (page - 1) * limit;

  let tweets = await prisma.tweet.findMany({
    where: { ownerId: userId },
    include: { multimedia: true,owner:true,likes:true,comments:{include:{owner:true}} },
    orderBy: { createdAt: "desc" },
    take: parseInt(limit),  
    skip: skip,
  });
  tweets = tweets.map((tweet) => {
    tweet.isLiked = tweet.likes.find((like) => like.ownerId === req.user.id) !== undefined;
    tweet.comments = tweet.comments.map((comment) => { comment.isLiked = comment.likes.find((like) => like.ownerId === req.user.id); return comment });
    return tweet
  });

  return res
    .status(httpCodes.ok)
    .json(new ApiResponse(httpCodes.ok, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(httpCodes.badRequest, "Content is required for update");
  }

  
  const existingTweet = await prisma.tweet.findFirst({
    where: {
      id: tweetId,
      ownerId: req.user.id,
    },
  });

  if (!existingTweet) {
    throw new ApiError(
      httpCodes.notFound,
      "Tweet not found or you are not authorized to edit it"
    );
  }

  // Update
  const updatedTweet = await prisma.tweet.update({
    where: { id: tweetId },
    data: { content },
    include: { multimedia: true },
  });

  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, updatedTweet, "Tweet updated successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  
  const tweet = await prisma.tweet.findFirst({
    where: {
      id: tweetId,
      ownerId: req.user.id, 
    },
    include: { multimedia: true },
  });

  console.log(tweet,tweetId);
  
  if (!tweet) {
    throw new ApiError(httpCodes.notFound, "Tweet not found or unauthorized");
  }


  if (tweet.multimedia && tweet.multimedia.length > 0) {
    await Promise.all(
      tweet.multimedia.map((media) => deleteFromCloudinary(media.publicId))
    );
  }

  await prisma.tweet.delete({ where: { id: tweetId } });

  return res
    .status(httpCodes.ok) 
    .json(new ApiResponse(httpCodes.ok, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };    