import { prisma } from "../../prisma/index.js";
import { httpCodes } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) { throw new ApiError(httpCodes.badRequest, "channelId is required"); }

  let toBeReturned = await prisma.subscription.deleteMany({ where: { subscriberId: req.user.id, channelId } });
  console.log(toBeReturned);
  
  if (toBeReturned.count===0) { toBeReturned = await prisma.subscription.create({ data: { subscriberId: req.user.id, channelId } }); }

  if (!toBeReturned) { throw new ApiError(httpCodes.notFound, "channel doesnot exists"); }

  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, toBeReturned, "toggled successfuly"))



  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(httpCodes.badRequest, "channelId is required");
  }

  const subscribers = await prisma.subscription.findMany({
    where: { channelId },
    select: { subscriber: {select:{userName:true,avatar:true,coverImage:true}} },
  });
  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(
        httpCodes.ok,
        subscribers,
        "sbscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(httpCodes.badRequest, "subscriberId is required");
  }

  const subscribedTo = await prisma.subscription.findMany({
    where: { subscriberId: channelId },
    include:{subscriber:{select:{userName:true,avatar:true,coverImage:true}}}
  });
  return res
    .status(httpCodes.ok)
    .json(
      new ApiResponse(
        httpCodes.ok,
        subscribedTo,
        "subscriber fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
