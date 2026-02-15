import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../../prisma/index.js";
import { httpCodes } from "../constants.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!(name && description)) { throw new ApiError(httpCodes.badRequest, "name and description of playlist is required"); }
  let playList;

  try{  playList = await prisma.playlist.create({ data: { description, name, ownerId: req.user.id } }); }
  catch (err) { throw new ApiError(httpCodes.serverSideError, "error while saving to db"); }
  
  return res.status(httpCodes.created).json(new ApiResponse(httpCodes.created, playList, "playlist created successfully"));
    

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const playlists = await prisma.playlist.findMany({ where: { ownerId: userId }, include: { videos: { include: { video: {include:{owner:true}} } } } });
  res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, playlists, "playlists fecthed successfully"));
  
  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playList = await prisma.playlist.findUnique({ where: { id: playlistId }, include: { videos: { include: { video: { include: { owner: true } } } } } });
  if (!playList) { throw new ApiError(httpCodes.notFound, "playlist doesnot exists"); }

  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, playList, "playlist fecthed successfully"));
  //TODO: get playlist by id
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  
  const playList = await prisma.playlist.findUnique({ where: { id: playlistId },include:{videos:{include:{video:true}}} });
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  
  if (!(playList && video)) { throw new ApiError(httpCodes.notFound, "both video and playlist needs to exists"); }
  const previouslyAdded = playList.videos.find((el) => el.videoId === video.id);
  
  if (previouslyAdded) { throw new ApiError(httpCodes.conflict, "video already exists in playlist"); }
  
  
  const videoAdded=await prisma.playlistVideo.create({
    data: { playlistId, videoId, position: playList.videos.length,description:video.description,isPublic:video.isPublished },
  });

  res.status(httpCodes.created).json(new ApiResponse(httpCodes.created,videoAdded, "video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!videoId) { throw new ApiError(httpCodes.badRequest, "videoId is required for removal"); }

  try
  {const video = await prisma.playlistVideo.deleteMany({ where: { video: { id: videoId, ownerId: req.user.id } } });}
  catch(err){ throw new ApiError(httpCodes.notFound, err?.message); }
  
  
  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, {}, "video removed from playlist  successfully"));


  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const deleted = await prisma.playlist.delete({ where: { id: playlistId, ownerId: req.user.id } });
  
  if (!deleted) { throw new ApiError(httpCodes.notFound, "playlist not found or you are not the owner"); }

  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, {}, "playlist deleted successfully"));

  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!(name && description)) { throw new ApiError(httpCodes.badRequest, "name and description are required"); }
  
  const playlist = await prisma.playlist.findFirst({ where: { id: playlistId } });
  if (!playlist) { throw new ApiError(httpCodes.notFound, "playlist doesnot exists"); }

  const playlistUpdated = await prisma.playlist.update({ where: { id: playlistId }, data: { name, description } });

  return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, playlistUpdated, "updated succcessfully"));
  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
