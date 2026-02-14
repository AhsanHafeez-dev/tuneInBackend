import { prisma } from "../../prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpCodes } from "../constants.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video

  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(httpCodes.badRequest, "videoId is required");
  }

  const start = (page-1) * limit;
  const comments = await prisma.comment.findMany({
    where: { videoId },
    skip: start,
    take: limit,
  });
  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, comments, "commenst fetched succesfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!(content && videoId)) {
    throw new ApiError(httpCodes.badRequest, "content and videoId is required");
  }
  const comment = await prisma.comment.create({
    data: {
      content,
      videoId,
      ownerId:req.user.id
    },
  });

  if (!comment) {
    throw new ApiError(httpCodes.serverSideError, "couldnot saved to database");
  }

  return res
    .status(httpCodes.created)
    .json(
      new ApiResponse(httpCodes.created, comment, "comment added successfully ")
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const {commentId} = req.params;
  const {  content } = req.body;

  if (!(commentId && content)) {
    throw new ApiError(
      httpCodes.badRequest,
      "commentId and content  both are  required"
    );
  }

  try{
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });}
  catch(err){
    throw new ApiError(httpCodes.notFound, "comment not found");
  }

  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;
  if (!commentId) {
    throw new ApiError(httpCodes.badRequest, "commentId is required");
  }

  const comment = await prisma.comment.delete({ where: { id: commentId } });
  if (!comment) {
    throw new ApiError(httpCodes.notFound, "comment not found");
  }

  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok));
  // TODO: delete a comment
});

const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.paarams;
  if (!tweetId) {
    throw new ApiError(httpCodes.badRequest, "tweetId is required");
  }

  const comments = await prisma.comment.findMany({ where: { tweetId } });
  if (comments === null || comments === undefined) {
    throw new ApiError(httpCodes.notFound, "cannot found tweet");
  }

  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, comments, "comments fetched successfully")
    );
});

const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.paarams;
  if (!commentId) {
    throw new ApiError(httpCodes.badRequest, "tweetId is required");
  }

  const comments = await prisma.comment.findMany({
    where: { parentCommentId: commentId },
  });

  if (comments === null || comments === undefined) {
    throw new ApiError(httpCodes.notFound, "cannot found comment");
  }

  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(httpCodes.ok, comments, "comments fetched successfully")
    );
});

const addCommentToTweet = asyncHandler(async (req, res) => {
  const { content, tweetId } = req.body;
  if (!(content && tweetId)) {
    throw new ApiError(
      httpCodes.badRequest,
      "content and tweetId are required"
    );
  }
  const comment = await prisma.comment.create({
    data: {
      content,
      tweetId,
      ownerId: req.user.id,
    },
  });

  if (!comment) {
    throw new ApiError(httpCodes.serverSideError, "couldnot saved to database");
  }
  return res
    .status(httpCodes.created)
    .json(
      new ApiResponse(httpCodes.created, comment, "comment added successfully ")
    );
});

const addCommentToComment = asyncHandler(async (req, res) => {
  const { content, commentId } = req.body;
  if (!(content && commentId)) {
    throw new ApiError(
      httpCodes.badRequest,
      "content and commentId is required"
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      parentCommentId: commentId,
      ownerId: req.user.id,
    },
  });

  if (!comment) {
    throw new ApiError(httpCodes.serverSideError, "couldnot saved to database");
  }

  return res
    .status(httpCodes.created)
    .json(
      new ApiResponse(httpCodes.created, comment, "comment added successfully ")
    );
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getTweetComments,
  addCommentToTweet,
  addCommentToComment,
  getCommentReplies,
};
